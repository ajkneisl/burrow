package app.burrow.features.burrows.sync

import app.burrow.features.burrows.membership.isModerator
import app.burrow.features.burrows.sync.block.Block
import app.burrow.features.burrows.sync.block.RegisterBlock
import io.ktor.util.date.getTimeMillis
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.Serializable
import java.util.Timer
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.concurrent.timerTask
import kotlin.time.Duration.Companion.minutes

/**
 * A configurable Pomodoro timer.
 *
 * By being in sync, this means it's at the same time for all users.
 */
@RegisterBlock
class Pomodoro(meetingId: String) : Block("POMODORO", meetingId) {
    /** Incoming actions. */
    enum class Incoming {
        RESET_TIMER,
        START_TIMER,
        END_TIMER,
        RETRIEVE_TIMER,
        CHANGE_PHASE,
    }

    /** Responses. */
    enum class Outgoing {
        STATE
    }

    /** The state of the timer. */
    @Serializable
    data class Payload(
        val isActive: Boolean,
        val isBreak: Boolean,
        val startedAt: Long,
        val durationMs: Long,
        val remainingMs: Long,
    )

    /** The saved state from the meeting. */
    val data by lazy { runBlocking { getState() } }

    /**
     * The amount of time the break is.
     *
     * If this isn't set by the user, it's 5 minutes by default.
     */
    val breakTime
        get() = data["BREAK_TIME"]?.toLong() ?: 5.minutes.inWholeMilliseconds

    /**
     * The amount of time the work time is.
     *
     * If this isn't set by the user, it's 20 minutes by default.
     */
    val workTime
        get() = data["WORK_TIME"]?.toLong() ?: 20.minutes.inWholeMilliseconds

    /** If the timer is active. */
    val isActive = AtomicBoolean(false)

    /**
     * The phase of the timer.
     *
     * If this is true, then the break is enabled.
     */
    val isBreak = AtomicBoolean(false)

    /**
     * The amount of time left on the timer. This is set based on [breakTime] or [workTime],
     * depending on the phase from [isBreak].
     */
    val timerDuration = AtomicLong(0L)

    /** When the timer began. */
    val timerStartTime = AtomicLong(0L)

    /**
     * A timer that calculates when the [timerStartTime] reaches the appropriate [timerDuration].
     *
     * When this reaches the time, it'll broadcast the state to all users.
     */
    @Volatile private var schedule = Timer("pomodoro", true)

    /**
     * The remaining number of milliseconds from [timerStartTime] and [timerDuration].
     *
     * @return The number of milliseconds remaining on the timer.
     */
    private fun remainingMs(): Long {
        val startedAt = timerStartTime.get()
        val duration = timerDuration.get()
        return if (isActive.get() && startedAt > 0) {
            val elapsed = (getTimeMillis() - startedAt).coerceAtLeast(0)
            (duration - elapsed).coerceAtLeast(0)
        } else {
            duration.coerceAtLeast(0)
        }
    }

    /** Broadcast the current state. */
    suspend fun broadcastState() {
        broadcastResponse(
            Outgoing.STATE,
            Payload(
                isActive.get(),
                isBreak.get(),
                timerStartTime.get(),
                timerDuration.get(),
                remainingMs(),
            ),
        )
    }

    /** Reset the timer. */
    private suspend fun UserBlockRequestState.resetTimer() {
        // user must be a moderator
        if (!(userID isModerator burrowID)) {
            return invalidPermissions()
        }

        schedule.cancel()
        schedule.purge()
        schedule = Timer("pomodoro", true)

        isActive.set(false)
        isBreak.set(false)
        timerDuration.set(workTime)
        timerStartTime.set(0)
        timerDuration.set(workTime)

        sendSuccess("Timer has been reset.")
        broadcastState()
    }

    /** Start the timer. */
    private suspend fun UserBlockRequestState.startTimer() {
        if (!(userID isModerator burrowID)) {
            return invalidPermissions()
        }

        timerStartTime.set(getTimeMillis())
        isActive.set(true)

        schedule.schedule(
            timerTask {
                isActive.set(false)
                timerStartTime.set(0)

                if (isBreak.get()) {
                    isBreak.set(false)
                    timerDuration.set(workTime)
                } else {
                    isBreak.set(true)
                    timerDuration.set(breakTime)
                }

                runBlocking { broadcastState() }
            },
            timerDuration.get(),
        )

        sendSuccess("Timer has been started.")
        broadcastState()
    }

    /** End the timer. */
    private suspend fun UserBlockRequestState.endTimer() {
        if (!(userID isModerator burrowID)) {
            return invalidPermissions()
        }

        schedule.cancel()
        schedule.purge()
        schedule = Timer("pomodoro", true)

        val now = getTimeMillis()
        val startedAt = timerStartTime.get()
        val currentDuration = timerDuration.get()
        val elapsed = if (isActive.get() && startedAt > 0) (now - startedAt).coerceAtLeast(0) else 0
        val remaining = (currentDuration - elapsed).coerceAtLeast(0)

        isActive.set(false)
        timerDuration.set(remaining)
        timerStartTime.set(0)

        sendSuccess("Timer has been ended.")
        broadcastState()
    }

    /** Retrieve the timer. */
    private suspend fun UserBlockRequestState.getTimer() {
        val remaining = remainingMs()

        sendResponse(
            Outgoing.STATE,
            Payload(
                isActive.get(),
                isBreak.get(),
                timerStartTime.get(),
                timerDuration.get(),
                remaining,
            ),
        )
    }

    /** Change the phase. */
    private suspend fun UserBlockRequestState.changePhase() {
        if (!(userID isModerator burrowID)) {
            return invalidPermissions()
        }

        schedule.cancel()
        schedule.purge()
        schedule = Timer("pomodoro", true)

        isBreak.set(!isBreak.get())
        isActive.set(false)

        timerDuration.set(if (isBreak.get()) breakTime else workTime)
        timerStartTime.set(0)

        broadcastState()
    }

    override val onIncoming: IncomingRequest = {
        when (action.asAction<Incoming>()) {
            Incoming.CHANGE_PHASE -> changePhase()
            Incoming.RESET_TIMER -> resetTimer()
            Incoming.START_TIMER -> startTimer()
            Incoming.END_TIMER -> endTimer()
            Incoming.RETRIEVE_TIMER -> getTimer()

            null -> invalidAction()
        }
    }

    override val onWelcome: suspend UserBlockRequestState.() -> Unit = {}

    override val defaultState: HashMap<String, String> =
        hashMapOf(
            "BREAK_TIME" to 5.minutes.inWholeMilliseconds.toString(),
            "WORK_TIME" to 20.minutes.inWholeMilliseconds.toString(),
        )
}