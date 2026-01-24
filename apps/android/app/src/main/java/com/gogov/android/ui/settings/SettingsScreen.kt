package com.gogov.android.ui.settings

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.NumberPicker
import android.widget.TextView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.gogov.android.util.DailyReminderWorker
import com.gogov.android.ui.components.PageTitle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onLogout: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    var notificationsEnabled by remember { mutableStateOf(false) }
    val reminderHour = state.reminderHour
    val reminderMinute = state.reminderMinute

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        notificationsEnabled = isGranted
    }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationsEnabled = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            notificationsEnabled = true
        }
    }
    LaunchedEffect(notificationsEnabled, reminderHour, reminderMinute) {
        if (notificationsEnabled) {
            DailyReminderWorker.schedule(context, reminderHour, reminderMinute)
        } else {
            DailyReminderWorker.cancel(context)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        PageTitle(title = "设置")

        Spacer(modifier = Modifier.height(24.dp))

        // User info
        state.user?.let { user ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "账号",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = user.email ?: "未绑定邮箱",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    user.username?.let { username ->
                        Text(
                            text = username,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // AI Configuration
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "AI 配置",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "配置你的 AI 服务商与模型",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = state.aiProvider,
                    onValueChange = { viewModel.setAiProvider(it) },
                    label = { Text("服务商") },
                    placeholder = { Text("如 openai、anthropic、deepseek") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.aiModel,
                    onValueChange = { viewModel.setAiModel(it) },
                    label = { Text("模型") },
                    placeholder = { Text("如 gpt-4、claude-3-opus") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.aiBaseUrl,
                    onValueChange = { viewModel.setAiBaseUrl(it) },
                    label = { Text("接口地址（可选）") },
                    placeholder = { Text("如 https://api.openai.com/v1") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                // API Key with toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (state.user?.aiApiKeyConfigured == true)
                            "API 密钥：已配置"
                        else
                            "API 密钥：未配置",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.weight(1f)
                    )
                    TextButton(onClick = { viewModel.toggleApiKeyField() }) {
                        Text(if (state.showApiKeyField) "取消" else "更新")
                    }
                }

                if (state.showApiKeyField) {
                    Spacer(modifier = Modifier.height(8.dp))
                    var showKey by remember { mutableStateOf(false) }
                    OutlinedTextField(
                        value = state.aiApiKey,
                        onValueChange = { viewModel.setAiApiKey(it) },
                        label = { Text("新的 API 密钥") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = if (showKey) VisualTransformation.None
                        else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { showKey = !showKey }) {
                                Icon(
                                    if (showKey) Icons.Default.VisibilityOff
                                    else Icons.Default.Visibility,
                                    contentDescription = "切换可见性"
                                )
                            }
                        }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = { viewModel.saveAiConfig() },
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
                    Text("保存 AI 配置")
                }

                // Success/Error messages
                state.successMessage?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = it,
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                state.error?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = it,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Daily Reminder
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "每日提醒",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "开启通知",
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            text = "每天提醒学习",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = { enabled ->
                            if (enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                            } else {
                                notificationsEnabled = enabled
                            }
                        }
                    )
                }

                if (notificationsEnabled) {
                    Spacer(modifier = Modifier.height(12.dp))
                    val timeLabel = String.format("%02d:%02d", reminderHour, reminderMinute)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("提醒时间")
                        Text(
                            text = timeLabel,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    AndroidView(
                        modifier = Modifier.fillMaxWidth(),
                        factory = { ctx ->
                            val layout = LinearLayout(ctx).apply {
                                orientation = LinearLayout.HORIZONTAL
                                gravity = Gravity.CENTER
                            }
                            val hourPicker = NumberPicker(ctx).apply {
                                minValue = 0
                                maxValue = 23
                                value = reminderHour
                                setFormatter { value -> String.format("%02d", value) }
                                setOnValueChangedListener { _, _, newVal ->
                                    viewModel.setReminderTime(newVal, reminderMinute)
                                    viewModel.saveReminderTime()
                                }
                            }
                            val colon = TextView(ctx).apply {
                                text = ":"
                                textSize = 20f
                                setPadding(8, 0, 8, 0)
                            }
                            val minutePicker = NumberPicker(ctx).apply {
                                minValue = 0
                                maxValue = 59
                                value = reminderMinute
                                setFormatter { value -> String.format("%02d", value) }
                                setOnValueChangedListener { _, _, newVal ->
                                    viewModel.setReminderTime(reminderHour, newVal)
                                    viewModel.saveReminderTime()
                                }
                            }
                            layout.addView(hourPicker)
                            layout.addView(colon)
                            layout.addView(minutePicker)
                            layout
                        },
                        update = { view ->
                            val hourPicker = view.getChildAt(0) as NumberPicker
                            val minutePicker = view.getChildAt(2) as NumberPicker
                            if (hourPicker.value != reminderHour) hourPicker.value = reminderHour
                            if (minutePicker.value != reminderMinute) minutePicker.value = reminderMinute
                        }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "每天 $timeLabel 提醒你学习",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Logout button
        OutlinedButton(
            onClick = { viewModel.logout(onLogout) },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = MaterialTheme.colorScheme.error
            ),
            enabled = !state.isLoggingOut
        ) {
            if (state.isLoggingOut) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text("退出登录")
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}
