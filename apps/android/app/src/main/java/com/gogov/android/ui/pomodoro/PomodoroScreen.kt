package com.gogov.android.ui.pomodoro

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.gogov.android.domain.model.PomodoroMode
import com.gogov.android.domain.model.PomodoroStatus
import com.gogov.android.ui.theme.Green600
import com.gogov.android.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PomodoroScreen(viewModel: PomodoroViewModel) {
    val state by viewModel.state.collectAsState()
    val customSubjects by viewModel.customSubjects.collectAsState()
    val insights by viewModel.insights.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val message by viewModel.message.collectAsState()
    val lastResult by viewModel.lastResult.collectAsState()

    val allSubjects = PomodoroViewModel.BUILT_IN_SUBJECTS + customSubjects.map { it.name }
    val isImmersive = state.status == PomodoroStatus.RUNNING || state.status == PomodoroStatus.PAUSED

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
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "Pomodoro Timer",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Focus on your studies",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Stats summary
        insights?.let { data ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatCard("Sessions", data.totals.sessions.toString())
                StatCard("Completed", data.totals.completed.toString())
                StatCard("Focus", DateUtils.formatMinutes(data.totals.focusMinutes))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

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
                            PomodoroStatus.COMPLETED -> "Session Completed!"
                            PomodoroStatus.FAILED -> "Session Failed"
                            else -> "Session Ended"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${result.subject} - ${result.elapsedSeconds / 60} minutes",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(onClick = { viewModel.clearLastResult() }) {
                        Text("Continue")
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
                        Text("Dismiss")
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Subject selection
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Select Subject",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(12.dp))
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    modifier = Modifier.height(120.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(allSubjects) { subject ->
                        SubjectChip(
                            subject = subject,
                            isSelected = state.subject == subject,
                            onClick = { viewModel.setSubject(subject) }
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Mode and duration
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Timer Mode",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = state.mode == PomodoroMode.COUNTDOWN,
                        onClick = { viewModel.setMode(PomodoroMode.COUNTDOWN) },
                        label = { Text("Countdown") }
                    )
                    FilterChip(
                        selected = state.mode == PomodoroMode.TIMER,
                        onClick = { viewModel.setMode(PomodoroMode.TIMER) },
                        label = { Text("Timer") }
                    )
                }

                if (state.mode == PomodoroMode.COUNTDOWN) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Duration: ${state.plannedMinutes} minutes",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(PomodoroViewModel.DURATION_PRESETS) { preset ->
                            FilterChip(
                                selected = state.plannedMinutes == preset,
                                onClick = { viewModel.setPlannedMinutes(preset) },
                                label = { Text("${preset}m") }
                            )
                        }
                    }
                } else {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Manual stop with segment tracking",
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
                text = if (state.mode == PomodoroMode.TIMER) "Start Timer" else "Start Focus",
                fontSize = 16.sp
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Exiting the app will auto-pause. Pause limit: 5 minutes.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
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
private fun SubjectChip(
    subject: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
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
                .background(Color(0xFF1a202c)),
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
                        progress = { progress.coerceIn(0f, 1f) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = Green600,
                        trackColor = Color.White.copy(alpha = 0.2f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Status text
                Text(
                    text = when {
                        state.status == PomodoroStatus.PAUSED ->
                            "Paused ${DateUtils.formatSeconds(state.pauseElapsedSeconds)} - ${DateUtils.formatSeconds(PomodoroViewModel.PAUSE_LIMIT_SECONDS - state.pauseElapsedSeconds)} remaining"
                        state.mode == PomodoroMode.COUNTDOWN ->
                            "Focused ${DateUtils.formatSeconds(state.elapsedSeconds)}"
                        else ->
                            "Elapsed ${DateUtils.formatSeconds(state.elapsedSeconds)}"
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.7f)
                )

                // Segments for timer mode
                if (state.mode == PomodoroMode.TIMER && state.segments.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Segments: ${state.segments.size}",
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
                                containerColor = Green600
                            )
                        ) {
                            Text("Pause")
                        }
                    } else {
                        Button(
                            onClick = onResume,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Green600
                            )
                        ) {
                            Text("Resume")
                        }
                    }

                    if (state.mode == PomodoroMode.TIMER && state.status == PomodoroStatus.RUNNING) {
                        OutlinedButton(
                            onClick = onAddSegment,
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Color.White
                            )
                        ) {
                            Text("Segment")
                        }
                    }

                    OutlinedButton(
                        onClick = onFinish,
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color.White
                        )
                    ) {
                        Text(if (state.mode == PomodoroMode.TIMER) "Stop & Save" else "End Session")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "Exit will auto-pause. Over 5 min pause = fail.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.5f),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
