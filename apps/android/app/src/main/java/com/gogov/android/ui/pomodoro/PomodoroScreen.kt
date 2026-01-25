package com.gogov.android.ui.pomodoro

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.graphics.toArgb
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import com.gogov.android.ui.components.PageTitle
import com.gogov.android.domain.model.PomodoroMode
import com.gogov.android.domain.model.PomodoroStatus
import com.gogov.android.domain.model.PomodoroTimeBucket
import com.gogov.android.domain.model.PomodoroRadarItem
import com.gogov.android.domain.model.PomodoroHeatmapDay
import com.gogov.android.util.DateUtils
import android.graphics.Paint
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import kotlin.math.PI
import kotlin.math.absoluteValue
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PomodoroScreen(
    viewModel: PomodoroViewModel,
    onOpenMore: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val customSubjects by viewModel.customSubjects.collectAsState()
    val insights by viewModel.insights.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val message by viewModel.message.collectAsState()
    val lastResult by viewModel.lastResult.collectAsState()

    val allSubjects = PomodoroViewModel.BUILT_IN_SUBJECTS + customSubjects.map { it.name }
    val isImmersive = state.status == PomodoroStatus.RUNNING || state.status == PomodoroStatus.PAUSED
    val selectionChipColors = FilterChipDefaults.filterChipColors(
        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer,
        containerColor = MaterialTheme.colorScheme.surfaceVariant,
        labelColor = MaterialTheme.colorScheme.onSurfaceVariant
    )
    val view = LocalView.current

    DisposableEffect(state.status) {
        val keepScreenOn = state.status == PomodoroStatus.RUNNING || state.status == PomodoroStatus.PAUSED
        view.keepScreenOn = keepScreenOn
        onDispose { view.keepScreenOn = false }
    }

    // Immersive timer dialog
    if (isImmersive) {
        ImmersiveTimerDialog(
            state = state,
            onPause = { viewModel.pauseSession() },
            onResume = { viewModel.resumeSession() },
            onFinish = {
                val finalStatus = if (state.mode == PomodoroMode.TIMER) {
                    PomodoroStatus.COMPLETED
                } else {
                    PomodoroStatus.ABANDONED
                }
                viewModel.finishSession(finalStatus)
            },
            onAddSegment = { viewModel.addSegment() }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onOpenMore) {
                Icon(Icons.Default.Menu, contentDescription = "更多功能")
            }
        }

        // Header
        PageTitle(
            title = "番茄钟",
            subtitle = "进入专注模式"
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Stats summary
        insights?.let { data ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatCard("累计次数", data.totals.sessions.toString())
                StatCard("累计完成", data.totals.completed.toString())
                StatCard("累计学习", DateUtils.formatMinutes(data.totals.focusMinutes))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "统计周期：近12周",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Last result
        lastResult?.let { result ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = when (result.status) {
                        PomodoroStatus.COMPLETED -> MaterialTheme.colorScheme.primaryContainer
                        PomodoroStatus.FAILED -> MaterialTheme.colorScheme.errorContainer
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = when (result.status) {
                            PomodoroStatus.COMPLETED -> "专注完成"
                            PomodoroStatus.FAILED -> "专注失败"
                            else -> "专注结束"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${result.subject} - ${result.elapsedSeconds / 60} 分钟",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { viewModel.clearLastResult() }) {
                        Text("继续")
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Error message
        message?.let {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = it,
                        modifier = Modifier.weight(1f),
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                    TextButton(onClick = { viewModel.clearMessage() }) {
                        Text("知道了")
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Subject selection
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "选择科目",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(12.dp))
                val columns = 3
                val subjectRows = allSubjects.chunked(columns)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    subjectRows.forEach { row ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            row.forEach { subject ->
                                SubjectChip(
                                    subject = subject,
                                    isSelected = state.subject == subject,
                                    onClick = { viewModel.setSubject(subject) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            if (row.size < columns) {
                                repeat(columns - row.size) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Mode and duration
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "计时方式",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = state.mode == PomodoroMode.COUNTDOWN,
                        onClick = { viewModel.setMode(PomodoroMode.COUNTDOWN) },
                        label = { Text("番茄钟") },
                        colors = selectionChipColors
                    )
                    FilterChip(
                        selected = state.mode == PomodoroMode.TIMER,
                        onClick = { viewModel.setMode(PomodoroMode.TIMER) },
                        label = { Text("计时器") },
                        colors = selectionChipColors
                    )
                }

                if (state.mode == PomodoroMode.COUNTDOWN) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "时长：${state.plannedMinutes} 分钟",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(PomodoroViewModel.DURATION_PRESETS) { preset ->
                            FilterChip(
                                selected = state.plannedMinutes == preset,
                                onClick = { viewModel.setPlannedMinutes(preset) },
                                label = { Text("${preset}m") },
                                colors = selectionChipColors
                            )
                        }
                    }
                } else {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "手动停止，支持分段记录",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Start button
        Button(
            onClick = { viewModel.startSession() },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading && state.subject.isNotBlank()
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = if (state.mode == PomodoroMode.TIMER) "开始计时" else "开始专注",
                fontSize = 16.sp
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "退出应用将自动暂停，暂停超过 5 分钟判定失败。",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        insights?.let { data ->
            val hasActivity = data.totals.sessions > 0
            if (!hasActivity) {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "暂无学习数据",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "完成一次番茄钟后即可查看学习分布与热力图。",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
            } else {
                TodayDistributionCard(
                    days = data.heatmap.days,
                    today = DateUtils.getBeijingDateString()
                )
                Spacer(modifier = Modifier.height(16.dp))
                HeatmapCard(days = data.heatmap.days)
                Spacer(modifier = Modifier.height(16.dp))
                TimeBucketsCard(buckets = data.timeBuckets)
                Spacer(modifier = Modifier.height(16.dp))
                RadarCard(items = data.radar)
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun TodayDistributionCard(days: List<PomodoroHeatmapDay>, today: String) {
    val day = days.firstOrNull { it.date == today } ?: days.lastOrNull()
    val totals = day?.totals?.filterValues { it > 0 } ?: emptyMap()
    val totalMinutes = totals.values.sum().takeIf { it > 0 } ?: day?.totalMinutes ?: 0

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "今日学习分布",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))

            if (totals.isEmpty() || totalMinutes <= 0) {
                Text(
                    text = "今日暂无学习记录",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                val topItems = totals.entries
                    .sortedByDescending { it.value }
                    .take(6)

                topItems.forEach { entry ->
                    val ratio = entry.value.toFloat() / max(1, totalMinutes).toFloat()
                    val color = subjectColor(entry.key)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(color, RoundedCornerShape(4.dp))
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = entry.key,
                            modifier = Modifier.weight(1f),
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Text(
                            text = "${entry.value} 分钟",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(ratio.coerceIn(0f, 1f))
                                .height(6.dp)
                                .background(color)
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }
        }
    }
}

@Composable
private fun HeatmapCard(days: List<PomodoroHeatmapDay>) {
    val formatter = remember { DateTimeFormatter.ISO_DATE }
    var selectedDay by remember { mutableStateOf<PomodoroHeatmapDay?>(null) }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "学习热力图",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))

            val startDate = LocalDate.of(2026, 1, 1)
            val parsedDays = days.mapNotNull { day ->
                runCatching { LocalDate.parse(day.date, formatter) }.getOrNull()?.let { parsed ->
                    parsed to day
                }
            }
            val filteredDays = parsedDays
                .filter { (date, _) -> !date.isBefore(startDate) }

            if (filteredDays.isEmpty()) {
                Text(
                    text = "暂无数据",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                val firstDate = filteredDays.first().first
                val gapDays = ChronoUnit.DAYS.between(startDate, firstDate).toInt().coerceAtLeast(0)
                val fillerDays = if (gapDays > 0) {
                    List(gapDays) { offset ->
                        val date = startDate.plusDays(offset.toLong()).toString()
                        PomodoroHeatmapDay(date = date, totalMinutes = 0)
                    }
                } else emptyList()
                val displayDays = fillerDays + filteredDays.map { it.second }
                val leading = (startDate.dayOfWeek.value + 6) % 7
                val cells: List<PomodoroHeatmapDay?> =
                    List(leading) { null } + displayDays
                val maxMinutes = filteredDays.maxOfOrNull { it.second.totalMinutes } ?: 0
                val emptyColor = Color(0xFFFFFFFF)
                val levelColors = listOf(
                    Color(0xFFE8F5E9),
                    Color(0xFFC8E6C9),
                    Color(0xFF81C784),
                    Color(0xFF43A047),
                    Color(0xFF1B5E20)
                )
                val borderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)

                val columns = 14
                val cellSpacing = 4.dp
                val rows = cells.chunked(columns)
                BoxWithConstraints {
                    val cellSize = (maxWidth - cellSpacing * (columns - 1)) / columns
                    Column(verticalArrangement = Arrangement.spacedBy(cellSpacing)) {
                        rows.forEach { row ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(cellSpacing)
                            ) {
                                row.forEach { item ->
                                    if (item == null) {
                                        Box(modifier = Modifier.size(cellSize))
                                    } else {
                                        val color = if (item.totalMinutes <= 0 || maxMinutes <= 0) {
                                            emptyColor
                                        } else {
                                            val ratio = item.totalMinutes.toFloat() / maxMinutes.toFloat()
                                            val index = when {
                                                ratio <= 0.2f -> 0
                                                ratio <= 0.4f -> 1
                                                ratio <= 0.6f -> 2
                                                ratio <= 0.8f -> 3
                                                else -> 4
                                            }
                                            levelColors[index]
                                        }
                                        Box(
                                            modifier = Modifier
                                                .size(cellSize)
                                                .clip(RoundedCornerShape(3.dp))
                                                .background(color)
                                                .border(1.dp, borderColor, RoundedCornerShape(3.dp))
                                                .clickable { selectedDay = item }
                                        )
                                    }
                                }
                                if (row.size < columns) {
                                    repeat(columns - row.size) {
                                        Box(modifier = Modifier.size(cellSize))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "白色表示未学习，绿色越深专注时长越高",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }

    selectedDay?.let { day ->
        val dateLabel = runCatching {
            LocalDate.parse(day.date, formatter)
                .format(DateTimeFormatter.ofPattern("yyyy年M月d日"))
        }.getOrElse { day.date }
        AlertDialog(
            onDismissRequest = { selectedDay = null },
            title = { Text(text = dateLabel) },
            text = { Text(text = "当天学习时间：${DateUtils.formatMinutes(day.totalMinutes.toDouble())}") },
            confirmButton = {
                TextButton(onClick = { selectedDay = null }) {
                    Text("知道了")
                }
            }
        )
    }
}

@Composable
private fun TimeBucketsCard(buckets: List<PomodoroTimeBucket>) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "高效时段",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))
            if (buckets.isEmpty()) {
                Text(
                    text = "暂无数据",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                val maxMinutes = buckets.maxOfOrNull { it.minutes } ?: 0
                buckets.forEach { bucket ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = bucket.label,
                            modifier = Modifier.width(56.dp),
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            val ratio =
                                if (maxMinutes <= 0) 0f else bucket.minutes.toFloat() / maxMinutes
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(ratio.coerceIn(0f, 1f))
                                    .height(6.dp)
                                    .background(MaterialTheme.colorScheme.primary)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "${bucket.minutes} 分钟",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }
        }
    }
}

@Composable
private fun RadarCard(items: List<PomodoroRadarItem>) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "科目雷达",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(12.dp))

            // Fixed subject order for radar chart
            val fixedOrder = listOf(
                "常识", "政治理论", "言语理解", "数量关系",
                "判断推理", "资料分析", "申论", "专业知识"
            )
            val itemMap = items.associateBy { it.subject }
            val extraItems = items.filter { it.subject !in fixedOrder }
                .sortedByDescending { it.minutes }

            // Build ordered list: fixed subjects first, then extras to fill remaining slots
            val orderedItems = mutableListOf<PomodoroRadarItem>()
            var extraIndex = 0
            for (subject in fixedOrder) {
                val item = itemMap[subject]
                if (item != null) {
                    orderedItems.add(item)
                } else if (extraIndex < extraItems.size) {
                    orderedItems.add(extraItems[extraIndex])
                    extraIndex++
                } else {
                    orderedItems.add(PomodoroRadarItem(subject = subject, minutes = 0))
                }
            }
            val selected = orderedItems
            if (selected.isEmpty()) {
                Text(
                    text = "暂无数据",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                val maxMinutes = max(1, selected.maxOf { it.minutes })
                val lineColor = MaterialTheme.colorScheme.primary
                val fillColor = lineColor.copy(alpha = 0.2f)
                val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                val ringStrokeWidth = with(LocalDensity.current) { 1.dp.toPx() }
                val pathStrokeWidth = with(LocalDensity.current) { 2.dp.toPx() }
                val labelTextSize = with(LocalDensity.current) { 12.sp.toPx() }
                val dotRadius = with(LocalDensity.current) { 3.dp.toPx() }
                val labelOffset = with(LocalDensity.current) { 18.dp.toPx() }
                val labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                val labelPaint = remember(labelTextSize, labelColor) {
                    Paint().apply {
                        isAntiAlias = true
                        textAlign = Paint.Align.CENTER
                        textSize = labelTextSize
                        color = labelColor.toArgb()
                    }
                }

                Canvas(modifier = Modifier.size(220.dp).align(Alignment.CenterHorizontally)) {
                    val center = androidx.compose.ui.geometry.Offset(size.width / 2, size.height / 2)
                    val radius = min(size.width, size.height) * 0.35f
                    val steps = selected.size
                    val rings = 3
                    for (i in 1..rings) {
                        val r = radius * (i / rings.toFloat())
                        drawCircle(
                            color = gridColor,
                            radius = r,
                            center = center,
                            style = Stroke(width = ringStrokeWidth)
                        )
                    }
                    selected.forEachIndexed { index, item ->
                        val angle = -PI / 2 + index * (2 * PI / steps)
                        val axisX = center.x + cos(angle).toFloat() * radius
                        val axisY = center.y + sin(angle).toFloat() * radius
                        drawLine(
                            color = gridColor,
                            start = center,
                            end = androidx.compose.ui.geometry.Offset(axisX, axisY),
                            strokeWidth = ringStrokeWidth
                        )
                        val dotColor = subjectColor(item.subject)
                        drawCircle(
                            color = dotColor,
                            radius = dotRadius,
                            center = androidx.compose.ui.geometry.Offset(axisX, axisY)
                        )
                        val labelRadius = radius + labelOffset
                        val labelX = center.x + cos(angle).toFloat() * labelRadius
                        val labelY = center.y + sin(angle).toFloat() * labelRadius
                        drawContext.canvas.nativeCanvas.drawText(
                            item.subject,
                            labelX,
                            labelY + labelTextSize / 3,
                            labelPaint
                        )
                    }
                    val points = selected.mapIndexed { index, item ->
                        val ratio = item.minutes.toFloat() / maxMinutes.toFloat()
                        val angle = -PI / 2 + index * (2 * PI / steps)
                        val x = center.x + cos(angle).toFloat() * radius * ratio
                        val y = center.y + sin(angle).toFloat() * radius * ratio
                        androidx.compose.ui.geometry.Offset(x, y)
                    }
                    val path = Path().apply {
                        moveTo(points.first().x, points.first().y)
                        points.drop(1).forEach { point -> lineTo(point.x, point.y) }
                        close()
                    }
                    drawPath(path, fillColor)
                    drawPath(path, lineColor, style = Stroke(width = pathStrokeWidth))
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            selected.forEach { item ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(subjectColor(item.subject), RoundedCornerShape(4.dp))
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${item.subject} · ${item.minutes} 分钟",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
            }
        }
    }
}

private fun subjectColor(subject: String): Color {
    val palette = listOf(
        Color(0xFFB5522B),
        Color(0xFF6B8F4E),
        Color(0xFF3B6C8E),
        Color(0xFF9C6B2F),
        Color(0xFF7A5C8E),
        Color(0xFF2F8A7A)
    )
    val index = (subject.hashCode().absoluteValue % palette.size)
    return palette[index]
}

@Composable
private fun SubjectChip(
    subject: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (isSelected) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.surfaceVariant
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = subject,
            style = MaterialTheme.typography.labelMedium,
            color = if (isSelected) MaterialTheme.colorScheme.onPrimary
            else MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1
        )
    }
}

@Composable
private fun ImmersiveTimerDialog(
    state: com.gogov.android.domain.model.PomodoroState,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onFinish: () -> Unit,
    onAddSegment: () -> Unit
) {
    val displaySeconds = if (state.mode == PomodoroMode.COUNTDOWN) {
        (state.plannedMinutes * 60 - state.elapsedSeconds).coerceAtLeast(0)
    } else {
        state.elapsedSeconds
    }

    val progress = if (state.mode == PomodoroMode.COUNTDOWN && state.plannedMinutes > 0) {
        state.elapsedSeconds.toFloat() / (state.plannedMinutes * 60)
    } else 0f

    Dialog(
        onDismissRequest = { },
        properties = DialogProperties(
            dismissOnBackPress = false,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF1C1B19)),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(32.dp)
            ) {
                // Subject
                Text(
                    text = state.subject,
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White.copy(alpha = 0.7f)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Timer display
                Text(
                    text = DateUtils.formatSeconds(displaySeconds),
                    style = MaterialTheme.typography.displayLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontSize = 72.sp
                )

                // Progress bar for countdown mode
                if (state.mode == PomodoroMode.COUNTDOWN) {
                    Spacer(modifier = Modifier.height(16.dp))
                    LinearProgressIndicator(
                        progress = progress.coerceIn(0f, 1f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = MaterialTheme.colorScheme.primary,
                        trackColor = Color.White.copy(alpha = 0.2f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Status text
                Text(
                    text = when {
                        state.status == PomodoroStatus.PAUSED ->
                            "已暂停 ${DateUtils.formatSeconds(state.pauseElapsedSeconds)} · 剩余 ${DateUtils.formatSeconds(PomodoroViewModel.PAUSE_LIMIT_SECONDS - state.pauseElapsedSeconds)}"
                        state.mode == PomodoroMode.COUNTDOWN ->
                            "已专注 ${DateUtils.formatSeconds(state.elapsedSeconds)}"
                        else ->
                            "已计时 ${DateUtils.formatSeconds(state.elapsedSeconds)}"
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.7f)
                )

                // Segments for timer mode
                if (state.mode == PomodoroMode.TIMER && state.segments.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "分段：${state.segments.size}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.5f)
                    )
                }

                Spacer(modifier = Modifier.height(48.dp))

                // Action buttons
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    if (state.status == PomodoroStatus.RUNNING) {
                        Button(
                            onClick = onPause,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text("暂停")
                        }
                    } else {
                        Button(
                            onClick = onResume,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text("继续")
                        }
                    }

                    if (state.mode == PomodoroMode.TIMER && state.status == PomodoroStatus.RUNNING) {
                        OutlinedButton(
                            onClick = onAddSegment,
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color.White
                            )
                        ) {
                            Text("分段")
                        }
                    }

                    OutlinedButton(
                        onClick = onFinish,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color.White
                        )
                    ) {
                        Text(if (state.mode == PomodoroMode.TIMER) "停止并保存" else "结束本次")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "退出将自动暂停，暂停超过 5 分钟将判定失败。",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.5f),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
