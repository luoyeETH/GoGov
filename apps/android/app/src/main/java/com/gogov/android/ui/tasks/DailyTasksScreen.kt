package com.gogov.android.ui.tasks

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.gogov.android.domain.model.CustomTask
import com.gogov.android.domain.model.CustomTaskOccurrence
import com.gogov.android.domain.model.CustomTaskRecurrenceType
import com.gogov.android.domain.model.TaskItem
import com.gogov.android.ui.components.PageTitle

private enum class TaskPage {
    Daily,
    Custom
}

private val weekdayOptions = listOf(
    1 to "一",
    2 to "二",
    3 to "三",
    4 to "四",
    5 to "五",
    6 to "六",
    0 to "日"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyTasksScreen(
    viewModel: DailyTasksViewModel,
    customTasksViewModel: CustomTasksViewModel,
    onNavigateToStudyPlan: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val customState by customTasksViewModel.state.collectAsState()
    var selectedPage by rememberSaveable { mutableStateOf(TaskPage.Daily) }
    val showSetupPrompt = state.profileLoaded && !state.hasTargetExam

    LaunchedEffect(Unit) {
        viewModel.loadTasks()
    }

    LaunchedEffect(selectedPage, customState.hasLoaded, customState.isLoading) {
        if (selectedPage == TaskPage.Custom && !customState.hasLoaded && !customState.isLoading) {
            customTasksViewModel.loadTasks()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Surface(
            tonalElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                PageTitle(title = "今日任务")
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (selectedPage == TaskPage.Daily) state.today else customState.date,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    when {
                        selectedPage == TaskPage.Daily && state.isSaving -> {
                            Text(
                                text = "正在保存...",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        selectedPage == TaskPage.Custom && customState.isLoading -> {
                            Text(
                                text = "同步中...",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                if (selectedPage == TaskPage.Daily) {
                    val greetingText = state.greetingText
                    val countdownText = state.countdownText
                    if (greetingText != null && countdownText != null) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = greetingText,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = countdownText,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                TaskPageSwitch(
                    selectedPage = selectedPage,
                    onSelect = { selectedPage = it }
                )
            }
        }

        if (selectedPage == TaskPage.Daily) {
            DailyTaskContent(
                state = state,
                showSetupPrompt = showSetupPrompt,
                onNavigateToStudyPlan = onNavigateToStudyPlan,
                onClearError = { viewModel.clearError() },
                onSetAdjustNote = { viewModel.setAdjustNote(it) },
                onGenerate = { viewModel.generateTasks(auto = false) },
                onToggleTask = { viewModel.toggleTask(it) },
                onToggleSubtask = { taskId, subtaskId -> viewModel.toggleSubtask(taskId, subtaskId) },
                onBreakdown = { viewModel.breakdownTask(it) }
            )
        } else {
            CustomTaskContent(
                state = customState,
                onReload = { customTasksViewModel.loadTasks() },
                onClearError = { customTasksViewModel.clearError() },
                onTitleChange = { customTasksViewModel.setTitle(it) },
                onNotesChange = { customTasksViewModel.setNotes(it) },
                onRecurrenceChange = { customTasksViewModel.setRecurrenceType(it) },
                onStartDateChange = { customTasksViewModel.setStartDate(it) },
                onIntervalDaysChange = { customTasksViewModel.setIntervalDays(it) },
                onToggleWeekday = { customTasksViewModel.toggleWeekday(it) },
                onCreate = { customTasksViewModel.createTask() },
                onComplete = { customTasksViewModel.completeTask(it) },
                onUncomplete = { customTasksViewModel.uncompleteTask(it) },
                onDelete = { customTasksViewModel.deleteTask(it) }
            )
        }
    }
}

@Composable
private fun TaskPageSwitch(
    selectedPage: TaskPage,
    onSelect: (TaskPage) -> Unit
) {
    val chipColors = FilterChipDefaults.filterChipColors(
        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        FilterChip(
            selected = selectedPage == TaskPage.Daily,
            onClick = { onSelect(TaskPage.Daily) },
            label = { Text("每日任务") },
            colors = chipColors
        )
        FilterChip(
            selected = selectedPage == TaskPage.Custom,
            onClick = { onSelect(TaskPage.Custom) },
            label = { Text("待办清单") },
            colors = chipColors
        )
    }
}

@Composable
private fun DailyTaskContent(
    state: DailyTasksUiState,
    showSetupPrompt: Boolean,
    onNavigateToStudyPlan: () -> Unit,
    onClearError: () -> Unit,
    onSetAdjustNote: (String) -> Unit,
    onGenerate: () -> Unit,
    onToggleTask: (String) -> Unit,
    onToggleSubtask: (String, String) -> Unit,
    onBreakdown: (TaskItem) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .weight(1f)
            .fillMaxWidth(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        state.error?.let { error ->
            item {
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
                        TextButton(onClick = onClearError) {
                            Text("知道了")
                        }
                    }
                }
            }
        }

        if (state.isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }

        if (showSetupPrompt) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "请先完善备考档案",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "填写目标考试和时间后，我们将为你生成每日任务。",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(onClick = onNavigateToStudyPlan) {
                            Text("前往设置")
                        }
                    }
                }
            }
        }

        if (!showSetupPrompt) {
            state.taskRecord?.summary?.let { summary ->
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Text(
                            text = summary,
                            modifier = Modifier.padding(16.dp),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }

        if (!showSetupPrompt) {
            state.taskRecord?.let { record ->
                if (record.tasks.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "今日暂无任务，点击生成即可。",
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    items(record.tasks, key = { it.id }) { task ->
                        TaskCard(
                            task = task,
                            isBreakingDown = state.breakdownTaskId == task.id,
                            onToggle = { onToggleTask(task.id) },
                            onToggleSubtask = { subtaskId -> onToggleSubtask(task.id, subtaskId) },
                            onBreakdown = { onBreakdown(task) }
                        )
                    }
                }
            }
        }

        if (!showSetupPrompt && state.taskRecord == null && !state.isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "今日暂无任务，先生成一份计划吧。",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        if (!showSetupPrompt) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = state.adjustNote,
                    onValueChange = onSetAdjustNote,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("调整说明") },
                    placeholder = { Text("例如：今天只有 1 小时") },
                    minLines = 2,
                    maxLines = 4
                )
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onGenerate,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !state.isGenerating && !state.isLoading
                ) {
                    if (state.isGenerating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.size(8.dp))
                        Text("正在生成...")
                    } else {
                        Text(if (state.taskRecord != null) "调整任务" else "生成任务")
                    }
                }
            }
        }
    }
}

@Composable
private fun CustomTaskContent(
    state: CustomTasksUiState,
    onReload: () -> Unit,
    onClearError: () -> Unit,
    onTitleChange: (String) -> Unit,
    onNotesChange: (String) -> Unit,
    onRecurrenceChange: (CustomTaskRecurrenceType) -> Unit,
    onStartDateChange: (String) -> Unit,
    onIntervalDaysChange: (String) -> Unit,
    onToggleWeekday: (Int) -> Unit,
    onCreate: () -> Unit,
    onComplete: (CustomTaskOccurrence) -> Unit,
    onUncomplete: (CustomTaskOccurrence) -> Unit,
    onDelete: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .weight(1f)
            .fillMaxWidth(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        state.error?.let { error ->
            item {
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
                        TextButton(onClick = onClearError) {
                            Text("知道了")
                        }
                    }
                }
            }
        }

        if (!state.hasLoaded && state.isLoading) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        } else {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onReload, enabled = !state.isLoading) {
                        Text("刷新")
                    }
                }
            }

            item {
                SectionCard(
                    title = "未完成列表",
                    subtitle = "按日期依次补齐，完成后才会刷新下一次。"
                ) {
                    if (state.overdueTasks.isEmpty()) {
                        EmptyHint(text = "暂无未完成任务。")
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            state.overdueTasks.forEach { item ->
                                val key = "${item.taskId}-${item.occurrenceDate}"
                                val processing = state.completingKeys.contains(key)
                                CustomOccurrenceItem(
                                    item = item,
                                    completed = false,
                                    showOccurrenceDate = true,
                                    processing = processing,
                                    onToggle = { onComplete(item) }
                                )
                            }
                        }
                    }
                }
            }

            item {
                SectionCard(
                    title = "今日任务",
                    subtitle = "完成后会进入下一次周期。"
                ) {
                    if (state.todayTasks.isEmpty() && state.completedTasks.isEmpty()) {
                        EmptyHint(text = "今日暂无待办任务。")
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            state.todayTasks.forEach { item ->
                                val key = "${item.taskId}-${item.occurrenceDate}"
                                val processing = state.completingKeys.contains(key)
                                CustomOccurrenceItem(
                                    item = item,
                                    completed = false,
                                    showOccurrenceDate = false,
                                    processing = processing,
                                    onToggle = { onComplete(item) }
                                )
                            }

                            if (state.completedTasks.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "已完成",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                state.completedTasks.forEach { item ->
                                    val key = "${item.taskId}-${item.occurrenceDate}"
                                    val processing = state.uncompletingKeys.contains(key)
                                    CustomOccurrenceItem(
                                        item = item,
                                        completed = true,
                                        showOccurrenceDate = false,
                                        processing = processing,
                                        onToggle = { onUncomplete(item) }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            item {
                SectionCard(
                    title = "创建待办任务",
                    subtitle = "可设置单次、每天、每周或间隔任务。"
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = state.title,
                            onValueChange = onTitleChange,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("任务名称") },
                            placeholder = { Text("例如：整理错题") },
                            enabled = !state.isSubmitting
                        )
                        OutlinedTextField(
                            value = state.notes,
                            onValueChange = onNotesChange,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("备注") },
                            placeholder = { Text("可选：资料/课程/时长") },
                            enabled = !state.isSubmitting
                        )

                        Text(
                            text = "重复规则",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            RecurrenceChip(
                                text = "单次任务",
                                selected = state.recurrenceType == CustomTaskRecurrenceType.once,
                                onClick = { onRecurrenceChange(CustomTaskRecurrenceType.once) }
                            )
                            RecurrenceChip(
                                text = "每天重复",
                                selected = state.recurrenceType == CustomTaskRecurrenceType.daily,
                                onClick = { onRecurrenceChange(CustomTaskRecurrenceType.daily) }
                            )
                            RecurrenceChip(
                                text = "每周指定",
                                selected = state.recurrenceType == CustomTaskRecurrenceType.weekly,
                                onClick = { onRecurrenceChange(CustomTaskRecurrenceType.weekly) }
                            )
                            RecurrenceChip(
                                text = "间隔天数",
                                selected = state.recurrenceType == CustomTaskRecurrenceType.interval,
                                onClick = { onRecurrenceChange(CustomTaskRecurrenceType.interval) }
                            )
                        }

                        OutlinedTextField(
                            value = state.startDate,
                            onValueChange = onStartDateChange,
                            modifier = Modifier.fillMaxWidth(),
                            label = {
                                Text(
                                    if (state.recurrenceType == CustomTaskRecurrenceType.once) {
                                        "任务日期 (YYYY-MM-DD)"
                                    } else {
                                        "开始日期 (YYYY-MM-DD)"
                                    }
                                )
                            },
                            enabled = !state.isSubmitting
                        )

                        if (state.recurrenceType == CustomTaskRecurrenceType.weekly) {
                            Text(
                                text = "每周重复",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Row(
                                modifier = Modifier.horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                weekdayOptions.forEach { option ->
                                    FilterChip(
                                        selected = state.weekdays.contains(option.first),
                                        onClick = { onToggleWeekday(option.first) },
                                        label = { Text("周${option.second}") }
                                    )
                                }
                            }
                        }

                        if (state.recurrenceType == CustomTaskRecurrenceType.interval) {
                            OutlinedTextField(
                                value = state.intervalDays,
                                onValueChange = onIntervalDaysChange,
                                modifier = Modifier.fillMaxWidth(),
                                label = { Text("间隔天数") },
                                enabled = !state.isSubmitting
                            )
                        }

                        Button(
                            onClick = onCreate,
                            enabled = !state.isSubmitting && !state.isLoading,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (state.isSubmitting) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.dp,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                                Spacer(modifier = Modifier.size(8.dp))
                                Text("添加中...")
                            } else {
                                Text("添加任务")
                            }
                        }
                    }
                }
            }

            item {
                SectionCard(
                    title = "已创建任务",
                    subtitle = "管理正在生效的待办任务。"
                ) {
                    if (state.tasks.isEmpty()) {
                        EmptyHint(text = "暂无已创建任务。")
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            state.tasks.forEach { task ->
                                CustomTaskLibraryItem(
                                    task = task,
                                    deleting = state.deletingTaskId == task.id,
                                    onDelete = { onDelete(task.id) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    subtitle: String? = null,
    content: @Composable () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            if (!subtitle.isNullOrBlank()) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            content()
        }
    }
}

@Composable
private fun EmptyHint(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

@Composable
private fun RecurrenceChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(text) }
    )
}

@Composable
private fun CustomOccurrenceItem(
    item: CustomTaskOccurrence,
    completed: Boolean,
    showOccurrenceDate: Boolean,
    processing: Boolean,
    onToggle: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (completed) {
                MaterialTheme.colorScheme.surfaceVariant
            } else {
                MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = completed,
                onCheckedChange = { onToggle() },
                enabled = !processing
            )
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.bodyLarge,
                    textDecoration = if (completed) TextDecoration.LineThrough else null,
                    color = if (completed) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }
                )
                val metaParts = mutableListOf<String>()
                if (showOccurrenceDate) {
                    metaParts.add("应完成：${item.occurrenceDate}")
                }
                metaParts.add(formatRecurrence(item.recurrenceType, item.intervalDays, item.weekdays))
                item.notes?.trim()?.takeIf { it.isNotBlank() }?.let { metaParts.add(it) }
                Text(
                    text = metaParts.joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (processing) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    strokeWidth = 2.dp
                )
            }
        }
    }
}

@Composable
private fun CustomTaskLibraryItem(
    task: CustomTask,
    deleting: Boolean,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(end = 12.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                val dateLabel = if (task.recurrenceType == CustomTaskRecurrenceType.once) {
                    "日期 ${task.startDate}"
                } else {
                    "开始于 ${task.startDate}"
                }
                val metaParts = mutableListOf(
                    formatRecurrence(task.recurrenceType, task.intervalDays, task.weekdays),
                    dateLabel
                )
                task.notes?.trim()?.takeIf { it.isNotBlank() }?.let { metaParts.add(it) }
                Text(
                    text = metaParts.joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            TextButton(
                onClick = onDelete,
                enabled = !deleting
            ) {
                Text(if (deleting) "删除中..." else "删除")
            }
        }
    }
}

private fun formatRecurrence(
    recurrenceType: CustomTaskRecurrenceType,
    intervalDays: Int?,
    weekdays: List<Int>
): String {
    return when (recurrenceType) {
        CustomTaskRecurrenceType.daily -> "每天"
        CustomTaskRecurrenceType.weekly -> {
            val sorted = weekdays.distinct().sorted()
            if (sorted.isEmpty()) {
                "每周"
            } else {
                "每周" + sorted.joinToString("、") { day -> weekdayLabel(day) }
            }
        }

        CustomTaskRecurrenceType.interval -> {
            val days = if (intervalDays != null && intervalDays > 0) intervalDays else 1
            "每隔 ${days} 天"
        }

        CustomTaskRecurrenceType.once -> "单次"
    }
}

private fun weekdayLabel(day: Int): String {
    return when (day) {
        0 -> "日"
        1 -> "一"
        2 -> "二"
        3 -> "三"
        4 -> "四"
        5 -> "五"
        6 -> "六"
        else -> ""
    }
}

@Composable
private fun TaskCard(
    task: TaskItem,
    isBreakingDown: Boolean,
    onToggle: () -> Unit,
    onToggleSubtask: (String) -> Unit,
    onBreakdown: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = task.done,
                    onCheckedChange = { onToggle() }
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = task.title,
                        style = MaterialTheme.typography.bodyLarge,
                        textDecoration = if (task.done) TextDecoration.LineThrough else null,
                        color = if (task.done) {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        task.durationMinutes?.let { minutes ->
                            Text(
                                text = "${minutes}分钟",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        task.notes?.let { notes ->
                            Text(
                                text = notes,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                TextButton(
                    onClick = onBreakdown,
                    enabled = !isBreakingDown && task.subtasks.isEmpty()
                ) {
                    Text(if (isBreakingDown) "..." else "拆解")
                }
            }

            if (task.subtasks.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Column(modifier = Modifier.padding(start = 40.dp)) {
                    task.subtasks.forEach { subtask ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            Checkbox(
                                checked = subtask.done,
                                onCheckedChange = { onToggleSubtask(subtask.id) },
                                modifier = Modifier.size(32.dp)
                            )
                            Text(
                                text = subtask.title,
                                style = MaterialTheme.typography.bodyMedium,
                                textDecoration = if (subtask.done) TextDecoration.LineThrough else null,
                                color = if (subtask.done) {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                } else {
                                    MaterialTheme.colorScheme.onSurface
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
