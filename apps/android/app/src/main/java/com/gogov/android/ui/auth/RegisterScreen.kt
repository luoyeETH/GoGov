package com.gogov.android.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.gogov.android.data.repository.AuthRepository
import kotlinx.coroutines.launch

enum class RegisterStep {
    EMAIL,
    VERIFICATION,
    PASSWORD
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
    var verificationCode by remember { mutableStateOf("") }
    var verificationToken by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
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
                onSuccess = { step = RegisterStep.VERIFICATION },
                onFailure = { errorMessage = it.message ?: "发送验证邮件失败" }
            )
        }
    }

    fun verifyEmail() {
        if (verificationCode.isBlank()) {
            errorMessage = "请输入邮箱中的验证令牌。"
            return
        }

        isLoading = true
        errorMessage = null

        scope.launch {
            val result = authRepository.verifyEmail(verificationCode.trim())
            isLoading = false

            result.fold(
                onSuccess = { verifiedEmail ->
                    verificationToken = verificationCode.trim()
                    if (verifiedEmail.isNotBlank()) {
                        email = verifiedEmail
                    }
                    step = RegisterStep.PASSWORD
                },
                onFailure = { errorMessage = it.message ?: "验证失败" }
            )
        }
    }

    fun completeRegistration() {
        val trimmedUsername = username.trim()
        if (trimmedUsername.isBlank()) {
            errorMessage = "请输入用户名（2-10 位）。"
            return
        }
        if (trimmedUsername.length !in 2..10 || trimmedUsername.contains(" ")) {
            errorMessage = "用户名需为 2-10 位，且不能包含空格。"
            return
        }
        if (password.isBlank()) {
            errorMessage = "请输入密码。"
            return
        }
        if (password != confirmPassword) {
            errorMessage = "两次密码不一致。"
            return
        }
        if (password.length < 8) {
            errorMessage = "密码至少 8 位。"
            return
        }

        isLoading = true
        errorMessage = null

        scope.launch {
            val result = authRepository.completeRegistration(
                trimmedUsername,
                password,
                verificationToken
            )
            isLoading = false

            result.fold(
                onSuccess = { onRegisterSuccess() },
                onFailure = { errorMessage = it.message ?: "注册失败" }
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
        Text(
            text = "学了么",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = when (step) {
                RegisterStep.EMAIL -> "邮箱注册"
                RegisterStep.VERIFICATION -> "验证邮箱"
                RegisterStep.PASSWORD -> "设置用户名与密码"
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

            RegisterStep.VERIFICATION -> {
                Text(
                    text = "验证邮件已发送至 $email，请复制邮箱中的令牌。",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = verificationCode,
                    onValueChange = { verificationCode = it },
                    label = { Text("邮箱验证令牌") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            verifyEmail()
                        }
                    ),
                    enabled = !isLoading
                )
            }

            RegisterStep.PASSWORD -> {
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("用户名") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    keyboardActions = KeyboardActions(
                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                    ),
                    enabled = !isLoading
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("密码") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Next
                    ),
                    keyboardActions = KeyboardActions(
                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                    ),
                    enabled = !isLoading
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("确认密码") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            completeRegistration()
                        }
                    ),
                    enabled = !isLoading
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
                    RegisterStep.VERIFICATION -> verifyEmail()
                    RegisterStep.PASSWORD -> completeRegistration()
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
                    isLoading && step == RegisterStep.VERIFICATION -> "正在验证..."
                    isLoading -> "正在创建..."
                    step == RegisterStep.EMAIL -> "发送验证邮件"
                    step == RegisterStep.VERIFICATION -> "验证令牌"
                    else -> "创建账号"
                }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onNavigateToLogin) {
            Text("已有账号？去登录")
        }
    }
}
