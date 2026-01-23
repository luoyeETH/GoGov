# Add project specific ProGuard rules here.

# Retrofit
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keepclassmembers,allowobfuscation class * {
    @com.squareup.moshi.* <methods>;
    @kotlinx.serialization.* <methods>;
}

# Keep kotlinx serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep model classes
-keep class com.gogov.android.domain.model.** { *; }
-keep class com.gogov.android.data.api.** { *; }
