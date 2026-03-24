package app.burrow.api.workers

import java.util.concurrent.TimeUnit

/**
 * Marks a suspend function as a scheduled worker.
 *
 * @param interval The interval between executions.
 * @param unit The time unit for the interval.
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Worker(val interval: Long, val unit: TimeUnit = TimeUnit.MINUTES)