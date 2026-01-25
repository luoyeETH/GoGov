package com.gogov.android.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.gogov.android.data.repository.AuthRepository
import com.gogov.android.ui.components.AuthBrand
import kotlinx.coroutines.launch

enum class RegisterStep {
    EMAIL,
    SENT
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    authRepository: AuthRepository,
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    var step by remember { mutableStateOf(RegisterStep.EMAIL) }
    var email by remember { mutableStateOf("") }
    var challengeId by remember { mutableStateOf("") }
    var challengeQuestion by remember { mutableStateOf("") }
    var challengeAnswer by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    LaunchedEffect(Unit) {
        val result = authRepository.getEmailChallenge()
        result.fold(
            onSuccess = {
                challengeId = it.id
                challengeQuestion = it.question
            },
            onFailure = { errorMessage = it.message ?: "获取验证码失败" }
        )
    }

    fun requestVerification() {
        if (email.isBlank()) {
            errorMessage = "请输入邮箱。"
            return
        }
        if (challengeId.isBlank() || challengeQuestion.isBlank()) {
            errorMessage = "验证码加载失败，请稍后重试。"
            return
        }
        if (challengeAnswer.isBlank()) {
            errorMessage = "请输入验证码答案。"
            return
        }

        isLoading = true
        errorMessage = null

        scope.launch {
            val result = authRepository.requestEmailVerification(
                email.trim(),
                challengeId,
                challengeAnswer.trim()
            )
            isLoading = false

            result.fold(
                onSuccess = { step = RegisterStep.SENT },
                onFailure = { errorMessage = it.message ?: "发送验证邮件失败" }
            )
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        AuthBrand()

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = when (step) {
                RegisterStep.EMAIL -> "邮箱注册"
                RegisterStep.SENT -> "查看邮箱完成注册"
            },
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(32.dp))

        when (step) {
            RegisterStep.EMAIL -> {
                if (challengeQuestion.isNotBlank()) {
                    Text(
                        text = "验证题：$challengeQuestion",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                }
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("邮箱") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            requestVerification()
                        }
                    ),
                    enabled = !isLoading
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = challengeAnswer,
                    onValueChange = { challengeAnswer = it },
                    label = { Text("验证码答案") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            requestVerification()
                        }
                    ),
                    enabled = !isLoading
                )
            }

            RegisterStep.SENT -> {
                Text(
                    text = "验证邮件已发送至 $email，请在邮件中完成注册信息填写，完成后返回登录。",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (errorMessage != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = errorMessage!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                when (step) {
                    RegisterStep.EMAIL -> requestVerification()
                    RegisterStep.SENT -> onNavigateToLogin()
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading
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
                when {
                    isLoading && step == RegisterStep.EMAIL -> "正在发送..."
                    isLoading -> "正在创建..."
                    step == RegisterStep.EMAIL -> "发送验证邮件"
                    else -> "去登录"
                }
            )
        }

        if (step == RegisterStep.SENT) {
            Spacer(modifier = Modifier.height(12.dp))
            TextButton(
                onClick = { requestVerification() },
                enabled = !isLoading
            ) {
                Text("重新发送邮件")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onNavigateToLogin) {
            Text("已有账号？去登录")
        }
    }
}
