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
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    fun requestVerification() {
        if (email.isBlank()) {
            errorMessage = "Please enter your email."
            return
        }

        isLoading = true
        errorMessage = null

        scope.launch {
            val result = authRepository.requestEmailVerification(email.trim())
            isLoading = false

            result.fold(
                onSuccess = { step = RegisterStep.VERIFICATION },
                onFailure = { errorMessage = it.message ?: "Failed to send verification email" }
            )
        }
    }

    fun verifyEmail() {
        if (verificationCode.isBlank()) {
            errorMessage = "Please enter verification code."
            return
        }

        isLoading = true
        errorMessage = null

        scope.launch {
            val result = authRepository.verifyEmail(email.trim(), verificationCode.trim())
            isLoading = false

            result.fold(
                onSuccess = { token ->
                    verificationToken = token
                    step = RegisterStep.PASSWORD
                },
                onFailure = { errorMessage = it.message ?: "Verification failed" }
            )
        }
    }

    fun completeRegistration() {
        if (password.isBlank()) {
            errorMessage = "Please enter a password."
            return
        }
        if (password != confirmPassword) {
            errorMessage = "Passwords do not match."
            return
        }
        if (password.length < 8) {
            errorMessage = "Password must be at least 8 characters."
            return
        }

        isLoading = true
        errorMessage = null

        scope.launch {
            val result = authRepository.completeRegistration(email.trim(), password, verificationToken)
            isLoading = false

            result.fold(
                onSuccess = { onRegisterSuccess() },
                onFailure = { errorMessage = it.message ?: "Registration failed" }
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
            text = "GoGov",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = when (step) {
                RegisterStep.EMAIL -> "Create your account"
                RegisterStep.VERIFICATION -> "Verify your email"
                RegisterStep.PASSWORD -> "Set your password"
            },
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(32.dp))

        when (step) {
            RegisterStep.EMAIL -> {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
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
            }

            RegisterStep.VERIFICATION -> {
                Text(
                    text = "We sent a verification code to $email",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = verificationCode,
                    onValueChange = { verificationCode = it },
                    label = { Text("Verification Code") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
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
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
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
                    label = { Text("Confirm Password") },
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
                    isLoading && step == RegisterStep.EMAIL -> "Sending..."
                    isLoading && step == RegisterStep.VERIFICATION -> "Verifying..."
                    isLoading -> "Creating account..."
                    step == RegisterStep.EMAIL -> "Send Verification Code"
                    step == RegisterStep.VERIFICATION -> "Verify"
                    else -> "Create Account"
                }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onNavigateToLogin) {
            Text("Already have an account? Login")
        }
    }
}
