package com.gogov.android.ui.chat

import android.graphics.Color
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.gogov.android.domain.model.ChatMessage
import com.gogov.android.domain.model.ChatMode
import com.gogov.android.ui.components.PageTitle
import io.noties.markwon.Markwon
import io.noties.markwon.ext.strikethrough.StrikethroughPlugin
import io.noties.markwon.ext.tables.TablePlugin
import io.noties.markwon.ext.latex.JLatexMathPlugin
import io.noties.markwon.inlineparser.MarkwonInlineParserPlugin
import org.json.JSONObject
import kotlin.math.roundToInt

private const val USE_WEB_KATEX = true
private const val KATEX_ASSET_BASE_URL = "file:///android_asset/katex/"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(viewModel: ChatViewModel) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()
    val displayMessages = remember(state.messages, state.isSending) {
        buildList {
            if (state.isSending) {
                add(
                    ChatMessage(
                        id = "thinking",
                        role = "assistant",
                        content = "思考中...",
                        createdAt = ""
                    )
                )
            }
            addAll(state.messages.asReversed())
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Header with mode toggle
        Surface(
            tonalElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            val selectionChipColors = FilterChipDefaults.filterChipColors(
                selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                labelColor = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Column(modifier = Modifier.padding(16.dp)) {
                PageTitle(
                    title = if (state.mode == ChatMode.PLANNER) "AI 规划" else "AI 导师",
                    subtitle = if (state.mode == ChatMode.PLANNER)
                        "备考规划辅助 · 最近 30 天记忆"
                    else
                        "快速答疑 · 不加载历史"
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = state.mode == ChatMode.TUTOR,
                        onClick = { viewModel.setMode(ChatMode.TUTOR) },
                        label = { Text("导师") },
                        colors = selectionChipColors,
                        enabled = !state.isSending
                    )
                    FilterChip(
                        selected = state.mode == ChatMode.PLANNER,
                        onClick = { viewModel.setMode(ChatMode.PLANNER) },
                        label = { Text("规划") },
                        colors = selectionChipColors,
                        enabled = !state.isSending
                    )
                }
            }
        }

        // Messages list
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            reverseLayout = true,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            if (state.isLoading) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(32.dp))
                    }
                }
            }

            if (state.messages.isEmpty() && !state.isLoading) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (state.mode == ChatMode.PLANNER)
                                "随时向我咨询你的备考规划！"
                            else
                                "发送问题，快速答疑。",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            items(displayMessages, key = { it.id }) { message ->
                ChatBubble(
                    message = message,
                    isPending = message.id == "thinking"
                )
            }
        }

        // Error message
        state.error?.let { error ->
            Surface(
                color = MaterialTheme.colorScheme.errorContainer,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = error,
                        modifier = Modifier.weight(1f),
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        style = MaterialTheme.typography.bodySmall
                    )
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("知道了")
                    }
                }
            }
        }

        // Input area
        Surface(
            tonalElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .padding(12.dp)
                    .fillMaxWidth(),
                verticalAlignment = Alignment.Bottom
            ) {
                OutlinedTextField(
                    value = state.inputText,
                    onValueChange = { viewModel.setInputText(it) },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("输入问题...") },
                    maxLines = 4,
                    enabled = !state.isSending
                )

                Spacer(modifier = Modifier.width(8.dp))

                IconButton(
                    onClick = { viewModel.sendMessage() },
                    enabled = !state.isSending && state.inputText.isNotBlank()
                ) {
                    if (state.isSending) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            Icons.Default.Send,
                            contentDescription = "发送",
                            tint = if (state.inputText.isNotBlank())
                                MaterialTheme.colorScheme.primary
                            else
                                MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatBubble(
    message: ChatMessage,
    isPending: Boolean = false
) {
    val isUser = message.role == "user"
    val isFailed = message.id.startsWith("failed-")

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                )
                .background(
                    when {
                        isFailed -> MaterialTheme.colorScheme.errorContainer
                        isUser -> MaterialTheme.colorScheme.primary
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }
                )
                .padding(12.dp)
        ) {
            if (isUser || isPending) {
                SelectionContainer {
                    Text(
                        text = message.content,
                        color = when {
                            isFailed -> MaterialTheme.colorScheme.onErrorContainer
                            isUser -> MaterialTheme.colorScheme.onPrimary
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        },
                        style = if (isPending)
                            MaterialTheme.typography.bodyMedium.copy(
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                        else
                            MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                if (USE_WEB_KATEX) {
                    KaTeXMarkdownText(
                        markdown = message.content,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    MarkdownText(
                        markdown = message.content,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun MarkdownText(
    markdown: String,
    color: androidx.compose.ui.graphics.Color
) {
    val context = LocalContext.current
    val density = LocalDensity.current
    val baseFontSize = MaterialTheme.typography.bodyMedium.fontSize
    val textSizeSp = if (baseFontSize == TextUnit.Unspecified) 14f else baseFontSize.value
    val latexTextSizePx = with(density) {
        val size = if (baseFontSize == TextUnit.Unspecified) 14.sp else baseFontSize
        size.toPx()
    }
    val markwon = remember(latexTextSizePx) {
        Markwon.builder(context)
            .usePlugin(MarkwonInlineParserPlugin.create())
            .usePlugin(StrikethroughPlugin.create())
            .usePlugin(TablePlugin.create(context))
            .usePlugin(JLatexMathPlugin.create(latexTextSizePx) { builder ->
                builder.inlinesEnabled(true)
                builder.blocksEnabled(true)
            })
            .build()
    }

    val normalizedMarkdown = remember(markdown) {
        normalizeLatex(markdown)
    }

    AndroidView(
        factory = { ctx ->
            TextView(ctx).apply {
                setTextColor(color.toArgb())
                textSize = textSizeSp
                setTextIsSelectable(true)
            }
        },
        update = { textView ->
            textView.setTextColor(color.toArgb())
            textView.textSize = textSizeSp
            textView.setTextIsSelectable(true)
            markwon.setMarkdown(textView, normalizedMarkdown)
        }
    )
}

@Composable
private fun KaTeXMarkdownText(
    markdown: String,
    color: androidx.compose.ui.graphics.Color
) {
    val baseFontSize = MaterialTheme.typography.bodyMedium.fontSize
    val textSizeSp = if (baseFontSize == TextUnit.Unspecified) 14f else baseFontSize.value
    val textColor = String.format("#%06X", 0xFFFFFF and color.toArgb())
    var contentHeightDp by remember(markdown) { mutableStateOf(0) }

    val normalizedMarkdown = remember(markdown) {
        normalizeLatex(markdown)
    }

    val onHeightChange by rememberUpdatedState { heightDp: Int ->
        if (heightDp > 0 && heightDp != contentHeightDp) {
            contentHeightDp = heightDp
        }
    }

    val html = remember(normalizedMarkdown, textColor, textSizeSp) {
        buildKaTeXHtml(
            markdown = normalizedMarkdown,
            textColor = textColor,
            textSizeSp = textSizeSp
        )
    }

    val heightDp = if (contentHeightDp > 0) contentHeightDp.dp else 1.dp

    AndroidView(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 1.dp)
            .height(heightDp),
        factory = { ctx ->
            val bridge = KaTeXHeightBridge(onHeightChange)
            WebView(ctx).apply {
                setBackgroundColor(Color.TRANSPARENT)
                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = false
                overScrollMode = WebView.OVER_SCROLL_NEVER
                isNestedScrollingEnabled = false

                settings.javaScriptEnabled = true
                settings.domStorageEnabled = false
                settings.allowFileAccess = true
                settings.allowFileAccessFromFileURLs = true
                settings.allowUniversalAccessFromFileURLs = false
                settings.allowContentAccess = false
                settings.blockNetworkLoads = true

                addJavascriptInterface(bridge, "AndroidHeight")

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String?) {
                        view.evaluateJavascript("window.__katexReportHeight && window.__katexReportHeight()") {}
                    }
                }
            }
        },
        update = { webView ->
            webView.loadDataWithBaseURL(
                KATEX_ASSET_BASE_URL,
                html,
                "text/html",
                "UTF-8",
                null
            )
        }
    )
}

private class KaTeXHeightBridge(
    private val onHeightChange: (Int) -> Unit
) {
    @android.webkit.JavascriptInterface
    fun reportHeight(height: Float) {
        onHeightChange(height.roundToInt())
    }
}

private fun buildKaTeXHtml(
    markdown: String,
    textColor: String,
    textSizeSp: Float
): String {
    val escaped = JSONObject.quote(markdown)
    return """
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="katex.min.css">
          <style>
            :root { color-scheme: light only; }
            html, body { margin: 0; padding: 0; background: transparent; }
            body { font-size: ${textSizeSp}px; line-height: 1.5; color: $textColor; }
            #content { word-wrap: break-word; }
            p { margin: 0 0 0.6em 0; }
            ul, ol { margin: 0 0 0.6em 1.2em; padding: 0; }
            code { font-family: monospace; background: rgba(0,0,0,0.06); padding: 0 4px; border-radius: 4px; }
            pre { background: rgba(0,0,0,0.06); padding: 8px; border-radius: 6px; overflow-x: auto; }
            table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
            th, td { border: 1px solid rgba(0,0,0,0.12); padding: 6px; }
            blockquote { margin: 0.6em 0; padding-left: 8px; border-left: 3px solid rgba(0,0,0,0.2); }
          </style>
        </head>
        <body>
          <div id="content"></div>
          <script src="marked.min.js"></script>
          <script src="katex.min.js"></script>
          <script src="contrib/auto-render.min.js"></script>
          <script>
            const raw = $escaped;
            const container = document.getElementById('content');
            let html = '';
            try {
              html = marked.parse(raw, { breaks: true });
            } catch (e) {
              html = raw.replace(/\\n/g, '<br>');
            }
            container.innerHTML = html;

            function renderMath() {
              try {
                renderMathInElement(container, {
                  delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\\\(", right: "\\\\)", display: false},
                    {left: "\\\\[", right: "\\\\]", display: true}
                  ],
                  throwOnError: false
                });
              } catch (e) {}
            }

            function reportHeight() {
              const content = document.getElementById('content');
              const rectHeight = content ? content.getBoundingClientRect().height : 0;
              const scrollHeight = content ? content.scrollHeight : 0;
              const height = Math.max(rectHeight, scrollHeight, 1);
              if (window.AndroidHeight && window.AndroidHeight.reportHeight) {
                window.AndroidHeight.reportHeight(height);
              }
            }

            window.__katexReportHeight = function() {
              reportHeight();
            };

            renderMath();
            reportHeight();
            setTimeout(reportHeight, 50);
            setTimeout(reportHeight, 200);
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(reportHeight).catch(() => {});
            }
          </script>
        </body>
        </html>
    """.trimIndent()
}

private fun normalizeLatex(markdown: String): String {
    var output = markdown

    output = output
        .replace('＄', '$')
        .replace("&dollar;", "$")
        .replace("&#36;", "$")
        .replace("\u200B", "")
        .replace("\uFEFF", "")

    val inlineParenRegex = Regex("""\\\(\s*([\s\S]+?)\s*\\\)""")
    output = inlineParenRegex.replace(output) { match ->
        "${'$'}${match.groupValues[1].trim()}${'$'}"
    }

    val blockBracketRegex = Regex("""\\\[\s*([\s\S]+?)\s*\\\]""")
    output = blockBracketRegex.replace(output) { match ->
        "${'$'}${'$'}${match.groupValues[1].trim()}${'$'}${'$'}"
    }

    val escapedInlineRegex = Regex("""\\\$\s*([^$\n]+?)\s*\\\$""")
    output = escapedInlineRegex.replace(output) { match ->
        "${'$'}${match.groupValues[1].trim()}${'$'}"
    }

    return normalizeMathSegments(output)
}

private fun normalizeMathSegments(text: String): String {
    fun unescapeMath(content: String): String {
        return content
            .replace(Regex("""\\\\(?=\S)""")) { "\\" }
            .trim()
    }

    var output = text
    val blockRegex = Regex("""\$\$\s*([\s\S]+?)\s*\$\$""")
    output = blockRegex.replace(output) { match ->
        "${'$'}${'$'}${unescapeMath(match.groupValues[1])}${'$'}${'$'}"
    }

    val inlineRegex = Regex("""(?<!\$)\$\s*([^$\n]+?)\s*\$(?!\$)""")
    output = inlineRegex.replace(output) { match ->
        "${'$'}${unescapeMath(match.groupValues[1])}${'$'}"
    }

    return output
}
