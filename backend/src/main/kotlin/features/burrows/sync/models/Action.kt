package app.burrow.features.burrows.sync.models

import kotlinx.serialization.Serializable

/** A response from [app.burrow.features.burrows.sync.BurrowSync]. */
@Serializable
data class Response<T>(val block: String, val type: String, val payload: T) {
    constructor(block: String, type: Enum<*>, payload: T) : this(block, type.name, payload)
}

/** An incoming request from [app.burrow.features.burrows.sync.BurrowSync]. */
@Serializable
data class Incoming(val block: String, val action: String, val data: HashMap<String, String>)
