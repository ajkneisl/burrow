import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

val exposed_version: String by project
val h2_version: String by project
val kotlin_version: String by project
val logback_version: String by project

plugins {
    kotlin("jvm") version "2.2.20"
    id("io.ktor.plugin") version "3.3.0"
    id("org.jetbrains.kotlin.plugin.serialization") version "2.2.20"
}

group = "app.burrow"

version = "0.4.3"

application { mainClass = "app.burrow.ApplicationKt" }

dependencies {
    implementation("io.ktor:ktor-client-cio")
    implementation("io.ktor:ktor-client-content-negotiation")

    implementation("io.ktor:ktor-server-auth")
    implementation("io.ktor:ktor-server-auth-jwt")

    implementation("io.ktor:ktor-serialization-kotlinx-json")
    implementation("io.ktor:ktor-server-cors")
    implementation("io.ktor:ktor-server-default-headers")
    implementation("io.ktor:ktor-server-core")
    implementation("io.ktor:ktor-server-auth")
    implementation("io.ktor:ktor-server-auth-jwt")
    implementation("io.ktor:ktor-server-auto-head-response")
    implementation("io.ktor:ktor-server-sse")
    implementation("io.ktor:ktor-server-host-common")
    implementation("io.ktor:ktor-server-status-pages")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-websockets")
    implementation("io.ktor:ktor-server-call-logging")

    implementation("dev.hayden:khealth:3.0.2")

    implementation("org.jetbrains.exposed:exposed-core:$exposed_version")
    implementation("org.jetbrains.exposed:exposed-r2dbc:$exposed_version")

    implementation("io.r2dbc:r2dbc-pool:1.0.2.RELEASE")
    implementation("org.postgresql:r2dbc-postgresql:1.0.7.RELEASE")

    implementation("io.github.flaxoos:ktor-server-rate-limiting:2.2.1")
    implementation("ch.qos.logback:logback-classic:$logback_version")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.reflections:reflections:0.10.2")
    implementation("org.mindrot:jbcrypt:0.4")
    implementation("dev.samstevens.totp:totp:1.7.1")

    implementation("io.minio:minio:8.6.0")

    // Google OAuth verification
    implementation("com.google.api-client:google-api-client:2.7.0")

    // AWS SES for email notifications
    implementation(platform("software.amazon.awssdk:bom:2.29.29"))
    implementation("software.amazon.awssdk:ses")

    // Web Push for browser notifications
    implementation("nl.martijndwars:web-push:5.1.1")

    // expo push for mobile notif
    implementation("io.github.hlspablo:expo-server-sdk-java:3.1.6")

    testImplementation("io.kotest:kotest-runner-junit5:6.0.4")
    testImplementation("io.kotest:kotest-assertions-core:6.0.4")
    testImplementation("io.kotest:kotest-property:6.0.4")
    testImplementation("io.kotest:kotest-assertions-ktor:6.0.4")

    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:$kotlin_version")
}

repositories {
    mavenCentral()
    maven("https://jitpack.io")
    maven("https://packages.confluent.io/maven/")
}

val compileKotlin: KotlinCompile by tasks
val compileTestKotlin: KotlinCompile by tasks

compileKotlin.compilerOptions { freeCompilerArgs.set(listOf("-Xnested-type-aliases")) }
compileTestKotlin.compilerOptions { freeCompilerArgs.set(listOf("-Xnested-type-aliases", "-Xskip-prerelease-check")) }

ktor {
    development = false
}

fun bumpVersion(type: String) {
    val buildFile = file("build.gradle.kts")
    val content = buildFile.readText()
    val versionRegex = """version\s*=\s*"(\d+)\.(\d+)\.(\d+)"""".toRegex()
    val match = versionRegex.find(content) ?: error("Could not find version in build.gradle.kts")

    val (major, minor, patch) = match.destructured
    val (newMajor, newMinor, newPatch) = when (type) {
        "major" -> Triple(major.toInt() + 1, 0, 0)
        "minor" -> Triple(major.toInt(), minor.toInt() + 1, 0)
        "patch" -> Triple(major.toInt(), minor.toInt(), patch.toInt() + 1)
        else -> error("Unknown bump type: $type. Use 'major', 'minor', or 'patch'")
    }

    val newVersion = "$newMajor.$newMinor.$newPatch"
    val newContent = content.replace(versionRegex, """version = "$newVersion"""")
    buildFile.writeText(newContent)
    println("Version bumped: ${match.groupValues[0].substringAfter("\"").substringBefore("\"")} -> $newVersion")
}

tasks.register("bumpPatch") {
    group = "versioning"
    description = "Bump the patch version (0.0.X)"
    doLast { bumpVersion("patch") }
}

tasks.register("bumpMinor") {
    group = "versioning"
    description = "Bump the minor version (0.X.0)"
    doLast { bumpVersion("minor") }
}

tasks.register("bumpMajor") {
    group = "versioning"
    description = "Bump the major version (X.0.0)"
    doLast { bumpVersion("major") }
}