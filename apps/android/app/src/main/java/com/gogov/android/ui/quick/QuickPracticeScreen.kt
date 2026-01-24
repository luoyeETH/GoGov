package com.gogov.android.ui.quick

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gogov.android.domain.model.QuickPracticeCategory
import com.gogov.android.domain.model.QuickPracticeQuestion
import kotlin.math.abs

@Composable
fun QuickPracticeScreen(viewModel: QuickPracticeViewModel) {
    val state by viewModel.state.collectAsState()
    val categoryMap = remember(state.categories) {
        state.categories.associateBy { it.id }
    }

    val currentQuestion = state.questions.getOrNull(state.currentIndex)
    val currentAnswer = currentQuestion?.let { state.answers[it.id] }
    val answered = currentAnswer != null
    val evaluation = if (currentQuestion != null && currentAnswer != null) {
        QuickPracticeEvaluator.evaluate(currentQuestion, currentAnswer, categoryMap[currentQuestion.categoryId])
    } else null

    val progressText = if (state.questions.isNotEmpty()) {
        "${minOf(state.currentIndex + 1, state.questions.size)}/${state.questions.size}"
    } else {
        "--"
    }

    val elapsedText = if (state.status == PracticeStatus.ACTIVE || state.status == PracticeStatus.DONE) {
        formatDuration(state.elapsedSeconds)
    } else {
        "--"
    }

    val results = remember(state.questions, state.answers, categoryMap) {
        state.questions.map { question ->
            val userAnswer = state.answers[question.id] ?: ""
            val eval = if (userAnswer.isNotBlank()) {
                QuickPracticeEvaluator.evaluate(question, userAnswer, categoryMap[question.categoryId])
            } else {
                QuickPracticeEvaluation(correct = false, isNumeric = false)
            }
            QuickPracticeResult(question, userAnswer, eval)
        }
    }
    val correctCount = results.count { it.evaluation.correct }
    val accuracy = if (results.isNotEmpty()) {
        (correctCount * 1000 / results.size) / 10.0
    } else 0.0
    val avgSeconds = if (results.isNotEmpty() && state.elapsedSeconds > 0) {
        state.elapsedSeconds.toDouble() / results.size
    } else 0.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(
            text = "速算练习",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "资料分析速算 · 即刻开练",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatPill("进度", progressText)
            StatPill("用时", elapsedText)
            StatPill("正确率", if (results.isNotEmpty()) "${accuracy}%" else "--")
        }

        Spacer(modifier = Modifier.height(20.dp))

        when (state.status) {
            PracticeStatus.IDLE, PracticeStatus.LOADING -> {
                SetupSection(state, viewModel)
            }
            PracticeStatus.ACTIVE -> {
                if (currentQuestion != null) {
                    QuestionSection(
                        question = currentQuestion,
                        answer = currentAnswer,
                        evaluation = evaluation,
                        inputValue = state.inputValue,
                        onInputChange = viewModel::updateInput,
                        onSubmit = viewModel::submitInput,
                        onChoice = viewModel::selectChoice,
                        onKeypad = viewModel::handleKeypad,
                        onNext = viewModel::nextQuestion,
                        autoNext = state.autoNext,
                        mode = state.mode
                    )
                }
            }
            PracticeStatus.DONE -> {
                ResultSection(
                    results = results,
                    accuracy = accuracy,
                    elapsedSeconds = state.elapsedSeconds,
                    avgSeconds = avgSeconds,
                    onRestart = viewModel::restart,
                    onStartNew = viewModel::startSession
                )
            }
        }

        if (state.error != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = state.error ?: "",
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.weight(1f)
                    )
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("知道了")
                    }
                }
            }
        }
    }
}

@Composable
@OptIn(ExperimentalLayoutApi::class)
private fun SetupSection(state: QuickPracticeUiState, viewModel: QuickPracticeViewModel) {
    val groups = remember(state.categories) {
        state.categories.map { it.group ?: "其他" }.distinct()
    }
    val currentGroup = if (state.selectedGroup.isNotBlank()) state.selectedGroup else groups.firstOrNull()
    val groupCategories = state.categories.filter { (it.group ?: "其他") == currentGroup }
    val selectionChipColors = FilterChipDefaults.filterChipColors(
        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
        containerColor = MaterialTheme.colorScheme.surfaceVariant,
        labelColor = MaterialTheme.colorScheme.onSurfaceVariant
    )

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("练习设置", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(12.dp))

            if (groups.isNotEmpty()) {
                Text("题型大类", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(groups) { group ->
                        FilterChip(
                            selected = group == currentGroup,
                            onClick = { viewModel.selectGroup(group) },
                            label = { Text(group) },
                            colors = selectionChipColors
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            Text("题型", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(8.dp))
            if (groupCategories.isNotEmpty()) {
                FlowRow(
                    maxItemsInEachRow = 3,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    groupCategories.forEach { category ->
                        FilterChip(
                            selected = category.id == state.selectedCategoryId,
                            onClick = { viewModel.selectCategory(category.id) },
                            label = { Text(category.name) },
                            colors = selectionChipColors
                        )
                    }
                }
            } else {
                Text("暂无题型", style = MaterialTheme.typography.bodyMedium)
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("练习模式", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = state.mode == PracticeMode.DRILL,
                    onClick = { viewModel.setMode(PracticeMode.DRILL) },
                    label = { Text("练习") },
                    colors = selectionChipColors
                )
                FilterChip(
                    selected = state.mode == PracticeMode.QUIZ,
                    onClick = { viewModel.setMode(PracticeMode.QUIZ) },
                    label = { Text("测验") },
                    colors = selectionChipColors
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("题量", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(8.dp))
            val setSizes = listOf(5, 10, 20, 30, 50)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(setSizes) { size ->
                    FilterChip(
                        selected = state.setSize == size,
                        onClick = { viewModel.setSetSize(size) },
                        label = { Text("$size 题") },
                        colors = selectionChipColors
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(checked = state.autoNext, onCheckedChange = { viewModel.toggleAutoNext() })
                Spacer(modifier = Modifier.width(8.dp))
                Text("答对后自动下一题")
            }

            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = { viewModel.startSession() },
                modifier = Modifier.fillMaxWidth(),
                enabled = state.selectedCategoryId.isNotBlank()
            ) {
                Text(if (state.status == PracticeStatus.LOADING) "生成中..." else "开始练习")
            }
        }
    }
}

@Composable
private fun QuestionSection(
    question: QuickPracticeQuestion,
    answer: String?,
    evaluation: QuickPracticeEvaluation?,
    inputValue: String,
    onInputChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onChoice: (String) -> Unit,
    onKeypad: (String) -> Unit,
    onNext: () -> Unit,
    autoNext: Boolean,
    mode: PracticeMode
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = question.prompt,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (!question.choices.isNullOrEmpty()) {
                question.choices.forEach { choice ->
                    ChoiceItem(
                        text = choice,
                        selected = answer == choice,
                        enabled = answer == null,
                        onClick = { onChoice(choice) }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            } else {
                OutlinedTextField(
                    value = inputValue,
                    onValueChange = onInputChange,
                    label = { Text("输入答案") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = KeyboardType.Number
                    ),
                    enabled = answer == null
                )
                Spacer(modifier = Modifier.height(12.dp))
                NumericKeypad(onKeyPress = onKeypad, enabled = answer == null)
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onSubmit,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = answer == null && inputValue.isNotBlank()
                ) {
                    Text("提交答案")
                }
            }

            if (answer != null && evaluation != null) {
                Spacer(modifier = Modifier.height(16.dp))
                ResultBadge(correct = evaluation.correct)
                if (!evaluation.correct) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "正确答案：${question.answer}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                if (question.explanation?.isNotBlank() == true) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "解析将在练习结束后展示",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (mode == PracticeMode.DRILL && (!evaluation.correct || !autoNext)) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(onClick = onNext, modifier = Modifier.fillMaxWidth()) {
                        Text("下一题")
                    }
                }
            }
        }
    }
}

@Composable
private fun ResultSection(
    results: List<QuickPracticeResult>,
    accuracy: Double,
    elapsedSeconds: Int,
    avgSeconds: Double,
    onRestart: () -> Unit,
    onStartNew: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("练习总结", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("正确率：${accuracy}%")
            Text("用时：${formatDuration(elapsedSeconds)}")
            Text("平均：${String.format("%.1f 秒/题", avgSeconds)}")

            Spacer(modifier = Modifier.height(12.dp))
            Button(onClick = onStartNew, modifier = Modifier.fillMaxWidth()) {
                Text("再来一组")
            }
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedButton(onClick = onRestart, modifier = Modifier.fillMaxWidth()) {
                Text("返回重选题型")
            }
        }
    }

    Spacer(modifier = Modifier.height(16.dp))

    results.forEach { result ->
        ResultItem(result)
        Spacer(modifier = Modifier.height(12.dp))
    }
}

@Composable
private fun ResultItem(result: QuickPracticeResult) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(result.question.prompt, fontWeight = FontWeight.SemiBold)
            Spacer(modifier = Modifier.height(6.dp))
            Text("你的答案：${result.userAnswer.ifBlank { "未作答" }}")
            Text("正确答案：${result.question.answer}")
            Text(
                text = if (result.evaluation.correct) "答对" else "答错",
                color = if (result.evaluation.correct) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
            )
            if (!result.question.explanation.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "解析：${result.question.explanation}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (!result.question.shortcut.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "技巧：${result.question.shortcut}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ChoiceItem(text: String, selected: Boolean, enabled: Boolean, onClick: () -> Unit) {
    Surface(
        tonalElevation = if (selected) 2.dp else 0.dp,
        shape = RoundedCornerShape(8.dp),
        color = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled, onClick = onClick)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(12.dp),
            color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun NumericKeypad(onKeyPress: (String) -> Unit, enabled: Boolean) {
    val keys = listOf(
        "7", "8", "9",
        "4", "5", "6",
        "1", "2", "3",
        "0", ".", "%",
        "toggle", "back", "clear"
    )
    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        modifier = Modifier.height(220.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(keys) { key ->
            val label = when (key) {
                "toggle" -> "±"
                "back" -> "退格"
                "clear" -> "清空"
                else -> key
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .clickable(enabled = enabled) { onKeyPress(key) }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(label, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun ResultBadge(correct: Boolean) {
    val color = if (correct) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer
    val textColor = if (correct) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(color)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(text = if (correct) "答对了" else "答错了", color = textColor)
    }
}

@Composable
private fun StatPill(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontWeight = FontWeight.Bold)
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

private fun formatDuration(seconds: Int): String {
    val safe = if (seconds < 0) 0 else seconds
    val minutes = safe / 60
    val remain = safe % 60
    return "$minutes:${remain.toString().padStart(2, '0')}"
}

data class QuickPracticeResult(
    val question: QuickPracticeQuestion,
    val userAnswer: String,
    val evaluation: QuickPracticeEvaluation
)
