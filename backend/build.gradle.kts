import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)
}

group = "app.burrow"

version = "0.6.0"

application { mainClass = "app.burrow.ApplicationKt" }

dependencies {
    implementation(kotlin("reflect"))

    implementation(libs.bundles.ktor.client)
    implementation(libs.bundles.ktor.server)

    implementation(libs.exposed.core)
    implementation(libs.exposed.r2dbc)
    implementation(libs.r2dbc.pool)
    implementation(libs.r2dbc.postgresql)

    implementation(libs.ktor.rate.limiting)
    implementation(libs.logback.classic)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.reflections)
    implementation(libs.jbcrypt)
    implementation(libs.minio)
    implementation(libs.google.api.client)
    implementation(platform(libs.aws.bom))
    implementation(libs.aws.ses)
    implementation(libs.web.push)
    implementation(libs.khealth)
    implementation(libs.expo.server.sdk)

    testImplementation(libs.bundles.kotest)
    testImplementation(libs.ktor.server.test.host)
    testImplementation(libs.kotlin.test.junit)
}

repositories {
    mavenCentral()
    maven("https://jitpack.io")
    maven("https://packages.confluent.io/maven/")

    // Bitwarden only publishes the Secrets Manager SDK to GitHub Packages,
    // which requires authentication even for public artifacts
    maven {
        url = uri("https://maven.pkg.github.com/bitwarden/sdk-sm")
        credentials {
            username =
                System.getenv("GITHUB_ACTOR") ?: findProperty("gpr.user")?.toString() ?: ""
            password =
                System.getenv("GITHUB_TOKEN") ?: findProperty("gpr.token")?.toString() ?: ""
        }
    }
}

// nested type aliases are stable as of language version 2.4, so the opt-in flag is no longer needed
val compileTestKotlin: KotlinCompile by tasks

compileTestKotlin.compilerOptions { freeCompilerArgs.set(listOf("-Xskip-prerelease-check")) }

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