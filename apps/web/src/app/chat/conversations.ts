export const conversationKey = "gogov_ai_chat_conversation_id";
export const conversationModeKey = "gogov_ai_chat_conversation_mode";
export const conversationStartKey = "gogov_ai_chat_conversation_start_at";

const markersKeyPrefix = "gogov_ai_chat_conversation_markers";
const MAX_MARKERS = 40;

export type ChatMode = "planner" | "tutor";

export type ChatMessageLike = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ConversationSession<TMessage extends ChatMessageLike = ChatMessageLike> = {
  id: string;
  startAt: string;
  endAt: string | null;
  messages: TMessage[];
  title: string;
};

type NormalizedTime = {
  iso: string;
  time: number;
};

function normalizeIsoTime(value: string | null | undefined): NormalizedTime | null {
  if (!value) {
    return null;
  }
  const millis = new Date(value).getTime();
  if (!Number.isFinite(millis)) {
    return null;
  }
  return { iso: new Date(millis).toISOString(), time: millis };
}

function getMarkersKey(mode: ChatMode) {
  return `${markersKeyPrefix}_${mode}`;
}

function normalizeMarkers(input: unknown): NormalizedTime[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set<number>();
  const normalized: NormalizedTime[] = [];
  input.forEach((item) => {
    const value = typeof item === "string" ? normalizeIsoTime(item) : null;
    if (!value || seen.has(value.time)) {
      return;
    }
    seen.add(value.time);
    normalized.push(value);
  });
  normalized.sort((a, b) => a.time - b.time);
  return normalized.slice(-MAX_MARKERS);
}

export function loadConversationMarkers(mode: ChatMode): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(getMarkersKey(mode));
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeMarkers(parsed).map((item) => item.iso);
  } catch {
    return [];
  }
}

function saveConversationMarkers(mode: ChatMode, markers: string[]) {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = normalizeMarkers(markers).map((item) => item.iso);
  window.localStorage.setItem(getMarkersKey(mode), JSON.stringify(normalized));
}

export function upsertConversationMarker(mode: ChatMode, startAt: string): string[] {
  const normalizedStart = normalizeIsoTime(startAt);
  if (!normalizedStart || typeof window === "undefined") {
    return loadConversationMarkers(mode);
  }
  const existing = loadConversationMarkers(mode);
  const merged = normalizeMarkers([...existing, normalizedStart.iso]).map((item) => item.iso);
  saveConversationMarkers(mode, merged);
  return merged;
}

function buildSessionTitle<TMessage extends ChatMessageLike>(messages: TMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  const raw = firstUser?.content?.trim();
  const safe = raw && raw !== "[图片消息]" ? raw : "[图片消息]";
  return safe.slice(0, 18) || "未命名提问";
}

export function buildConversationSessions<TMessage extends ChatMessageLike>(
  messages: TMessage[],
  markers: string[]
): ConversationSession<TMessage>[] {
  if (!messages.length && !markers.length) {
    return [];
  }

  const sortedMessages = [...messages].sort((a, b) => {
    const at = new Date(a.createdAt).getTime();
    const bt = new Date(b.createdAt).getTime();
    if (!Number.isFinite(at) || !Number.isFinite(bt)) {
      return 0;
    }
    return at - bt;
  });

  const normalizedMarkers = normalizeMarkers(markers);

  if (sortedMessages.length) {
    const firstMessageTime = normalizeIsoTime(sortedMessages[0].createdAt);
    if (
      firstMessageTime &&
      (!normalizedMarkers.length || firstMessageTime.time < normalizedMarkers[0].time)
    ) {
      normalizedMarkers.unshift(firstMessageTime);
    }
  }

  if (!normalizedMarkers.length) {
    return [
      {
        id: "default",
        startAt: sortedMessages[0]?.createdAt ?? new Date().toISOString(),
        endAt: null,
        messages: sortedMessages,
        title: buildSessionTitle(sortedMessages)
      }
    ];
  }

  const shells = normalizedMarkers.map((marker, index) => {
    const next = normalizedMarkers[index + 1] ?? null;
    return {
      start: marker,
      end: next,
      messages: [] as TMessage[]
    };
  });

  let currentIndex = 0;
  sortedMessages.forEach((message) => {
    const time = normalizeIsoTime(message.createdAt);
    if (!time) {
      shells[currentIndex]?.messages.push(message);
      return;
    }
    while (currentIndex < shells.length - 1) {
      const end = shells[currentIndex].end;
      if (!end || time.time < end.time) {
        break;
      }
      currentIndex += 1;
    }
    shells[currentIndex]?.messages.push(message);
  });

  return shells.map((shell) => {
    const startAt = shell.start.iso;
    const endAt = shell.end?.iso ?? null;
    const title = buildSessionTitle(shell.messages);
    return {
      id: startAt,
      startAt,
      endAt,
      messages: shell.messages,
      title
    };
  });
}

export function selectActiveSession<TMessage extends ChatMessageLike>(
  sessions: ConversationSession<TMessage>[],
  preferredStartAt: string | null
): ConversationSession<TMessage> | null {
  if (!sessions.length) {
    return null;
  }
  const normalizedPreferred = normalizeIsoTime(preferredStartAt);
  if (normalizedPreferred) {
    const exact = sessions.find((session) => session.startAt === normalizedPreferred.iso);
    if (exact) {
      return exact;
    }
  }
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    if (sessions[index].messages.length > 0) {
      return sessions[index];
    }
  }
  return sessions[sessions.length - 1];
}

export function resolveSessionStartFromKey<TMessage extends ChatMessageLike>(
  key: string | null,
  sessions: ConversationSession<TMessage>[]
): string | null {
  const normalized = normalizeIsoTime(key);
  if (normalized) {
    return normalized.iso;
  }
  if (!key) {
    return null;
  }
  const containing = sessions.find((session) =>
    session.messages.some((message) => message.id === key)
  );
  return containing?.startAt ?? null;
}

export function getLatestSessionStart(mode: ChatMode): string | null {
  const markers = loadConversationMarkers(mode);
  return markers.length ? markers[markers.length - 1] : null;
}

