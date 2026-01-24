package com.gogov.android.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "gogov_prefs")

class TokenManager(private val context: Context) {

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("session_token")
        private val LAST_EMAIL_KEY = stringPreferencesKey("last_email")
    }

    val token: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }

    val lastEmail: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[LAST_EMAIL_KEY]
    }

    fun getTokenSync(): String? {
        return runBlocking {
            context.dataStore.data.first()[TOKEN_KEY]
        }
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
        }
    }

    suspend fun saveLastEmail(email: String) {
        context.dataStore.edit { preferences ->
            preferences[LAST_EMAIL_KEY] = email
        }
    }

    suspend fun getLastEmail(): String? {
        return context.dataStore.data.first()[LAST_EMAIL_KEY]
    }

    suspend fun clearLastEmail() {
        context.dataStore.edit { preferences ->
            preferences.remove(LAST_EMAIL_KEY)
        }
    }

    suspend fun clearToken() {
        context.dataStore.edit { preferences ->
            preferences.remove(TOKEN_KEY)
        }
    }

    suspend fun hasToken(): Boolean {
        return context.dataStore.data.first()[TOKEN_KEY] != null
    }
}
