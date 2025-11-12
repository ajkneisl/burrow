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

version = "0.2.0"

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