package com.gogov.android.ui.studyplan

import android.app.DatePickerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudyPlanScreen(
    viewModel: StudyPlanViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.loadProfile()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("备考档案") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { padding ->
        if (state.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                Text(
                    text = "完善你的备考信息",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "这些信息将用于生成个性化学习规划",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Prep Start Date
                DateField(
                    label = "初次备考时间",
                    value = state.prepStartDate,
                    onValueChange = { viewModel.setPrepStartDate(it) }
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = state.totalStudyDuration,
                    onValueChange = { viewModel.setTotalStudyDuration(it) },
                    label = { Text("累计学习时间") },
                    placeholder = { Text("例如 45天 / 2个月") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = state.currentProgress,
                    onValueChange = { viewModel.setCurrentProgress(it) },
                    label = { Text("当前学习进度") },
                    placeholder = { Text("例如：行测完成 2 轮，申论还在基础阶段") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = state.targetExam,
                    onValueChange = { viewModel.setTargetExam(it) },
                    label = { Text("目标考试") },
                    placeholder = { Text("例如：2026 国考 或 江苏省考") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Target Exam Date
                DateField(
                    label = "目标考试时间",
                    value = state.targetExamDate,
                    onValueChange = { viewModel.setTargetExamDate(it) }
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = state.studyResources,
                    onValueChange = { viewModel.setStudyResources(it) },
                    label = { Text("学习工具与进度") },
                    placeholder = { Text("例如：XX申论20课（已学3课）") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4,
                    supportingText = { Text("描述可用资料/课程/题库与当前进度") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Interview experience dropdown
                var expanded by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = when (state.interviewExperience) {
                            "yes" -> "是"
                            "no" -> "否"
                            else -> ""
                        },
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("是否进入过面试") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("请选择") },
                            onClick = {
                                viewModel.setInterviewExperience("")
                                expanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("是") },
                            onClick = {
                                viewModel.setInterviewExperience("yes")
                                expanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("否") },
                            onClick = {
                                viewModel.setInterviewExperience("no")
                                expanded = false
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = state.notes,
                    onValueChange = { viewModel.setNotes(it) },
                    label = { Text("补充说明") },
                    placeholder = { Text("例如：白天上班，仅晚间可学习") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    maxLines = 4
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Error/Success messages
                state.error?.let { error ->
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                state.successMessage?.let { message ->
                    Text(
                        text = message,
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                Button(
                    onClick = { viewModel.saveProfile(onBack) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !state.isSaving
                ) {
                    if (state.isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text("保存备考档案")
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun DateField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit
) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()

    // Parse existing value
    if (value.isNotBlank()) {
        try {
            val parts = value.split("-")
            if (parts.size == 3) {
                calendar.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
            }
        } catch (_: Exception) {}
    }

    OutlinedTextField(
        value = value,
        onValueChange = {},
        readOnly = true,
        label = { Text(label) },
        placeholder = { Text("点击选择日期") },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        trailingIcon = {
            TextButton(
                onClick = {
                    DatePickerDialog(
                        context,
                        { _, year, month, dayOfMonth ->
                            val formatted = "%04d-%02d-%02d".format(year, month + 1, dayOfMonth)
                            onValueChange(formatted)
                        },
                        calendar.get(Calendar.YEAR),
                        calendar.get(Calendar.MONTH),
                        calendar.get(Calendar.DAY_OF_MONTH)
                    ).show()
                }
            ) {
                Text("选择")
            }
        }
    )
}
