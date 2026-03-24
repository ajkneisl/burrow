package app.burrow.api.workers

import java.util.Timer
import kotlin.concurrent.timerTask
import kotlin.reflect.full.callSuspend
import kotlin.reflect.jvm.kotlinFunction
import kotlinx.coroutines.runBlocking
import org.reflections.Reflections
import org.reflections.scanners.Scanners
import org.reflections.util.ClasspathHelper
import org.reflections.util.ConfigurationBuilder
import org.slf4j.LoggerFactory

private val workerTimer = Timer()
private val logger = LoggerFactory.getLogger("Workers")

/** Discover all @Worker-annotated functions and schedule them. */
fun scheduleWorkers() {
    val reflections =
        Reflections(
            ConfigurationBuilder()
                .setUrls(ClasspathHelper.forPackage("app.burrow"))
                .setScanners(Scanners.MethodsAnnotated)
        )

    val methods = reflections.getMethodsAnnotatedWith(Worker::class.java)

    for (method in methods) {
        val annotation = method.getAnnotation(Worker::class.java)
        val delayMs = annotation.unit.toMillis(annotation.interval)
        val kFunction = method.kotlinFunction ?: continue

        logger.info("Scheduling worker {} every {} ms", method.name, delayMs)

        workerTimer.schedule(timerTask { runBlocking { kFunction.callSuspend() } }, 0, delayMs)
    }
}
