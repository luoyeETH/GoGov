package com.gogov.android.ui.chat

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(viewModel: ChatViewModel) {
    val state by viewModel.state.collectAsState()
    val listState = rememberLazyListState()

    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.size - 1)
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

            items(state.messages) { message ->
                ChatBubble(message = message)
            }

            if (state.isSending) {
                item {
                    ChatBubble(
                        message = ChatMessage(
                            id = "thinking",
                            role = "assistant",
                            content = "思考中...",
                            createdAt = ""
                        ),
                        isPending = true
                    )
                }
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
                MarkdownText(
                    markdown = message.content,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
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
