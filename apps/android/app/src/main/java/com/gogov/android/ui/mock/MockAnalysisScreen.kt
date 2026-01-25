package com.gogov.android.ui.mock

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import coil.compose.rememberAsyncImagePainter
import com.gogov.android.domain.model.MockHistoryRecord
import com.gogov.android.domain.model.MockAnalysisResponse
import java.time.OffsetDateTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MockAnalysisScreen(
    viewModel: MockAnalysisViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(MockInputMode.IMAGE) }

    LaunchedEffect(Unit) {
        viewModel.loadHistory()
    }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        uri?.let { viewModel.setSelectedImage(it, context) }
    }

    if (state.error != null) {
        AlertDialog(
            onDismissRequest = {
                viewModel.clearError()
            },
            title = { Text("提示") },
            text = { Text(state.error ?: "") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.clearError()
                }) {
                    Text("知道了")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("模考解读") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    TabRow(selectedTabIndex = if (selectedTab == MockInputMode.IMAGE) 0 else 1) {
                        Tab(
                            selected = selectedTab == MockInputMode.IMAGE,
                            onClick = { selectedTab = MockInputMode.IMAGE },
                            text = { Text("上传图片") }
                        )
                        Tab(
                            selected = selectedTab == MockInputMode.MANUAL,
                            onClick = { selectedTab = MockInputMode.MANUAL },
                            text = { Text("手动录入") }
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "模考数据录入",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (selectedTab == MockInputMode.IMAGE) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                }
                            ) {
                                Icon(Icons.Default.Image, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("选择图片")
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            state.selectedImageUri?.let { uri ->
                                Image(
                                    painter = rememberAsyncImagePainter(uri),
                                    contentDescription = "模考图片",
                                    modifier = Modifier
                                        .size(80.dp),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(onClick = { viewModel.clearSelectedImage() }) {
                                    Icon(Icons.Default.Close, contentDescription = "移除图片")
                                }
                            }
                        }
                    } else {
                        Text(
                            text = "手动数据",
                            style = MaterialTheme.typography.titleSmall
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        state.metrics.forEachIndexed { index, metric ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "科目 ${index + 1}",
                                            style = MaterialTheme.typography.bodyMedium,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (state.metrics.size > 1) {
                                            IconButton(onClick = { viewModel.removeMetricRow(index) }) {
                                                Icon(Icons.Default.Close, contentDescription = "删除")
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    OutlinedTextField(
                                        value = metric.subject,
                                        onValueChange = { value ->
                                            viewModel.updateMetric(index) { it.copy(subject = value) }
                                        },
                                        label = { Text("科目") },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        OutlinedTextField(
                                            value = metric.correct,
                                            onValueChange = { value ->
                                                viewModel.updateMetric(index) { it.copy(correct = value) }
                                            },
                                            label = { Text("正确") },
                                            modifier = Modifier.weight(1f),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                                        )
                                        OutlinedTextField(
                                            value = metric.total,
                                            onValueChange = { value ->
                                                viewModel.updateMetric(index) { it.copy(total = value) }
                                            },
                                            label = { Text("总题数") },
                                            modifier = Modifier.weight(1f),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                                        )
                                        OutlinedTextField(
                                            value = metric.timeMinutes,
                                            onValueChange = { value ->
                                                viewModel.updateMetric(index) { it.copy(timeMinutes = value) }
                                            },
                                            label = { Text("耗时(分)") },
                                            modifier = Modifier.weight(1f),
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        OutlinedButton(onClick = { viewModel.addMetricRow() }) {
                            Icon(Icons.Default.Add, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("添加科目")
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = state.title,
                        onValueChange = { viewModel.setTitle(it) },
                        label = { Text("标题（可选）") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = state.note,
                        onValueChange = { viewModel.setNote(it) },
                        label = { Text("备注（可选）") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            viewModel.submitAnalysis(selectedTab)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isSubmitting
                    ) {
                        if (state.isSubmitting) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text("开始解读")
                    }
                }
            }

            state.result?.let { result ->
                ResultSection(result)
            }

            Text(text = "历史记录", style = MaterialTheme.typography.titleMedium)
            if (state.isLoadingHistory) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                if (state.history.isEmpty()) {
                    Text(
                        text = "暂无模考解读记录。",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    state.history.forEach { item ->
                        HistoryCard(item)
                    }
                }
            }
        }
    }
}

@Composable
private fun ResultSection(result: MockAnalysisResponse) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "解读结果", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            if (!result.summary.isNullOrBlank()) {
                Text(text = result.summary, style = MaterialTheme.typography.bodyMedium)
            }
            result.details?.takeIf { it.isNotEmpty() }?.let { list ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "关键发现", style = MaterialTheme.typography.titleSmall)
                list.forEach { line ->
                    Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
                }
            }
            result.practiceFocus?.takeIf { it.isNotEmpty() }?.let { list ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "练习建议", style = MaterialTheme.typography.titleSmall)
                list.forEach { line ->
                    Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
                }
            }
            result.nextWeekPlan?.takeIf { it.isNotEmpty() }?.let { list ->
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "下周安排", style = MaterialTheme.typography.titleSmall)
                list.forEach { line ->
                    Text(text = "• $line", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun HistoryCard(item: MockHistoryRecord) {
    val accuracyText = item.overallAccuracy?.let { String.format("%.1f%%", it * 100) } ?: "--"
    val timeText = item.timeTotalMinutes?.let { "${it.toInt()} 分钟" } ?: "--"
    val dateText = item.createdAt.takeIf { it.isNotBlank() }?.let {
        runCatching { OffsetDateTime.parse(it).toLocalDate().toString() }.getOrNull()
    } ?: item.createdAt

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = item.title,
                style = MaterialTheme.typography.titleSmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "正确率：$accuracyText · 总耗时：$timeText",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (!dateText.isNullOrBlank()) {
                Text(
                    text = dateText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            item.analysis?.summary?.takeIf { it.isNotBlank() }?.let { summary ->
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = summary,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
