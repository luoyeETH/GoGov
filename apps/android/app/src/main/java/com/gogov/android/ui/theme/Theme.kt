package com.gogov.android.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Brand,
    onPrimary = White,
    primaryContainer = BrandLight,
    onPrimaryContainer = BrandDark,
    secondary = BrandDark,
    onSecondary = White,
    secondaryContainer = WarmBgAccent,
    onSecondaryContainer = WarmText,
    tertiary = WarmMuted,
    onTertiary = White,
    background = WarmBg,
    onBackground = WarmText,
    surface = WarmCard,
    onSurface = WarmText,
    surfaceVariant = WarmBgAccent,
    onSurfaceVariant = WarmMuted,
    outline = WarmBorder,
    error = Red600,
    onError = White
)

@Composable
fun GoGovTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.surface.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
