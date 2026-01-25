package com.gogov.android.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.gogov.android.GoGovApplication
import com.gogov.android.data.api.ApiClient
import com.gogov.android.data.local.PomodoroStorage
import com.gogov.android.data.local.TokenManager
import com.gogov.android.data.repository.AuthRepository
import com.gogov.android.data.repository.ChatRepository
import com.gogov.android.data.repository.DailyTaskRepository
import com.gogov.android.data.repository.ExpenseRepository
import com.gogov.android.data.repository.MockRepository
import com.gogov.android.data.repository.PomodoroRepository
import com.gogov.android.data.repository.QuickPracticeRepository
import com.gogov.android.ui.auth.LoginScreen
import com.gogov.android.ui.auth.RegisterScreen
import com.gogov.android.ui.chat.ChatScreen
import com.gogov.android.ui.chat.ChatViewModel
import com.gogov.android.ui.ledger.LedgerScreen
import com.gogov.android.ui.ledger.LedgerViewModel
import com.gogov.android.ui.mock.MockAnalysisScreen
import com.gogov.android.ui.mock.MockAnalysisViewModel
import com.gogov.android.ui.more.MoreFeaturesScreen
import com.gogov.android.ui.pomodoro.PomodoroScreen
import com.gogov.android.ui.pomodoro.PomodoroViewModel
import com.gogov.android.ui.quick.QuickPracticeScreen
import com.gogov.android.ui.quick.QuickPracticeViewModel
import com.gogov.android.ui.settings.SettingsScreen
import com.gogov.android.ui.settings.SettingsViewModel
import com.gogov.android.ui.studyplan.StudyPlanScreen
import com.gogov.android.ui.studyplan.StudyPlanViewModel
import com.gogov.android.ui.tasks.DailyTasksScreen
import com.gogov.android.ui.tasks.DailyTasksViewModel
import com.gogov.android.ui.theme.GoGovTheme

sealed class Screen(val route: String, val label: String) {
    object Pomodoro : Screen("pomodoro", "番茄钟")
    object Tasks : Screen("tasks", "今日任务")
    object QuickPractice : Screen("quick", "速算")
    object Chat : Screen("chat", "AI 答疑")
    object Settings : Screen("settings", "设置")
    object StudyPlan : Screen("studyplan", "备考档案")
    object More : Screen("more", "更多功能")
    object MockAnalysis : Screen("mock-analysis", "模考解读")
    object Ledger : Screen("ledger", "记账本")
    object Login : Screen("login", "登录")
    object Register : Screen("register", "注册")
}

val bottomNavItems = listOf(
    Screen.Pomodoro to Icons.Default.Timer,
    Screen.Tasks to Icons.Default.CheckCircle,
    Screen.Chat to Icons.Default.Chat,
    Screen.QuickPractice to Icons.Default.Calculate,
    Screen.Settings to Icons.Default.Person
)

class MainActivity : ComponentActivity() {

    private lateinit var tokenManager: TokenManager
    private lateinit var pomodoroStorage: PomodoroStorage
    private lateinit var authRepository: AuthRepository
    private lateinit var pomodoroRepository: PomodoroRepository
    private lateinit var chatRepository: ChatRepository
    private lateinit var dailyTaskRepository: DailyTaskRepository
    private lateinit var quickPracticeRepository: QuickPracticeRepository
    private lateinit var mockRepository: MockRepository
    private lateinit var expenseRepository: ExpenseRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        tokenManager = TokenManager(this)
        val initialLoggedIn = tokenManager.getTokenSync() != null
        pomodoroStorage = PomodoroStorage(this)
        ApiClient.initialize(tokenManager)

        authRepository = AuthRepository(tokenManager)
        pomodoroRepository = PomodoroRepository()
        chatRepository = ChatRepository()
        dailyTaskRepository = DailyTaskRepository()
        quickPracticeRepository = QuickPracticeRepository()
        mockRepository = MockRepository()
        expenseRepository = ExpenseRepository()

        setContent {
            GoGovTheme {
                MainContent(initialLoggedIn = initialLoggedIn)
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    private fun MainContent(initialLoggedIn: Boolean) {
        val navController = rememberNavController()
        val isLoggedIn by authRepository.isLoggedIn.collectAsState(initial = initialLoggedIn)

        val pomodoroViewModel = remember {
            PomodoroViewModel(
                pomodoroRepository,
                pomodoroStorage,
                GoGovApplication.instance.appLifecycleObserver
            )
        }
        val chatViewModel = remember { ChatViewModel(chatRepository) }
        val dailyTasksViewModel = remember { DailyTasksViewModel(dailyTaskRepository, authRepository) }
        val settingsViewModel = remember { SettingsViewModel(authRepository) }
        val studyPlanViewModel = remember { StudyPlanViewModel(authRepository) }
        val quickPracticeViewModel = remember { QuickPracticeViewModel(quickPracticeRepository) }
        val mockAnalysisViewModel = remember { MockAnalysisViewModel(mockRepository) }
        val ledgerViewModel = remember { LedgerViewModel(expenseRepository) }

        LaunchedEffect(isLoggedIn) {
            if (isLoggedIn) {
                pomodoroViewModel.loadData()
                chatViewModel.loadHistory()
                dailyTasksViewModel.loadTasks()
                settingsViewModel.loadUser()
            }
        }

        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentDestination = navBackStackEntry?.destination
        val showBottomBar = isLoggedIn && currentDestination?.route in bottomNavItems.map { it.first.route }

        Scaffold(
            modifier = Modifier.fillMaxSize(),
            bottomBar = {
                if (showBottomBar) {
                    NavigationBar(
                        containerColor = MaterialTheme.colorScheme.surface,
                        tonalElevation = 0.dp
                    ) {
                        bottomNavItems.forEach { (screen, icon) ->
                            val selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true
                            val isChat = screen == Screen.Chat
                            NavigationBarItem(
                                icon = {
                                    if (isChat) {
                                        val containerColor = if (selected) {
                                            MaterialTheme.colorScheme.primary
                                        } else {
                                            MaterialTheme.colorScheme.primaryContainer
                                        }
                                        val iconColor = if (selected) {
                                            MaterialTheme.colorScheme.onPrimary
                                        } else {
                                            MaterialTheme.colorScheme.primary
                                        }
                                        Surface(
                                            color = containerColor,
                                            shape = CircleShape,
                                            shadowElevation = 6.dp,
                                            modifier = Modifier
                                                .size(44.dp)
                                                .offset(y = (-4).dp)
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Icon(
                                                    icon,
                                                    contentDescription = screen.label,
                                                    tint = iconColor,
                                                    modifier = Modifier.size(22.dp)
                                                )
                                            }
                                        }
                                    } else {
                                        Icon(icon, contentDescription = screen.label)
                                    }
                                },
                                label = { Text(screen.label) },
                                selected = selected,
                                onClick = {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                                ,
                                colors = if (isChat) {
                                    NavigationBarItemDefaults.colors(
                                        indicatorColor = Color.Transparent,
                                        selectedTextColor = MaterialTheme.colorScheme.primary,
                                        unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                } else {
                                    NavigationBarItemDefaults.colors()
                                }
                            )
                        }
                    }
                }
            }
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = if (isLoggedIn) Screen.Pomodoro.route else Screen.Login.route,
                modifier = Modifier.padding(innerPadding)
            ) {
                composable(Screen.Login.route) {
                    LoginScreen(
                        authRepository = authRepository,
                        onLoginSuccess = {
                            navController.navigate(Screen.Pomodoro.route) {
                                popUpTo(Screen.Login.route) { inclusive = true }
                            }
                        },
                        onNavigateToRegister = {
                            navController.navigate(Screen.Register.route)
                        }
                    )
                }

                composable(Screen.Register.route) {
                    RegisterScreen(
                        authRepository = authRepository,
                        onRegisterSuccess = {
                            navController.navigate(Screen.Pomodoro.route) {
                                popUpTo(Screen.Login.route) { inclusive = true }
                            }
                        },
                        onNavigateToLogin = {
                            navController.popBackStack()
                        }
                    )
                }

                composable(Screen.Pomodoro.route) {
                    PomodoroScreen(
                        viewModel = pomodoroViewModel,
                        onOpenMore = { navController.navigate(Screen.More.route) }
                    )
                }

                composable(Screen.Tasks.route) {
                    DailyTasksScreen(
                        viewModel = dailyTasksViewModel,
                        onNavigateToStudyPlan = {
                            navController.navigate(Screen.StudyPlan.route)
                        }
                    )
                }

                composable(Screen.Chat.route) {
                    ChatScreen(viewModel = chatViewModel)
                }

                composable(Screen.QuickPractice.route) {
                    QuickPracticeScreen(viewModel = quickPracticeViewModel)
                }

                composable(Screen.Settings.route) {
                    SettingsScreen(
                        viewModel = settingsViewModel,
                        onLogout = {
                            navController.navigate(Screen.Login.route) {
                                popUpTo(0) { inclusive = true }
                            }
                        },
                        onNavigateToMore = { navController.navigate(Screen.More.route) }
                    )
                }

                composable(Screen.StudyPlan.route) {
                    StudyPlanScreen(
                        viewModel = studyPlanViewModel,
                        onBack = {
                            navController.popBackStack()
                        }
                    )
                }

                composable(Screen.More.route) {
                    MoreFeaturesScreen(
                        onBack = { navController.popBackStack() },
                        onNavigateToStudyPlan = { navController.navigate(Screen.StudyPlan.route) },
                        onNavigateToMock = { navController.navigate(Screen.MockAnalysis.route) },
                        onNavigateToLedger = { navController.navigate(Screen.Ledger.route) }
                    )
                }

                composable(Screen.MockAnalysis.route) {
                    MockAnalysisScreen(
                        viewModel = mockAnalysisViewModel,
                        onBack = { navController.popBackStack() }
                    )
                }

                composable(Screen.Ledger.route) {
                    LedgerScreen(
                        viewModel = ledgerViewModel,
                        onBack = { navController.popBackStack() }
                    )
                }
            }
        }
    }
}
