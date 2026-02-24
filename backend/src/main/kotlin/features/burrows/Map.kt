package app.burrow.features.burrows

import app.burrow.env
import app.burrow.features.account.getAllBlockedRelationships
import app.burrow.features.burrows.models.Burrow
import app.burrow.api.query
import app.burrow.api.toEntity
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.serialization.kotlinx.json.json
import io.ktor.util.date.getTimeMillis
import java.net.URLEncoder
import kotlin.random.Random
import kotlinx.coroutines.flow.toList
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.r2dbc.selectAll
import org.slf4j.Logger
import org.slf4j.LoggerFactory

/**
 * The type of general location.
 */
@Serializable
enum class LocationType {
    PARKING,
    VENDING,
    STUDY,
    RESTROOM,
    FOOD,
    OTHER
}

/**
 * Sealed class representing any location on the map.
 */
@Serializable
sealed class Location {
    abstract val type: String
    abstract val lat: Double
    abstract val lng: Double

    /**
     * A few details about a Burrow to aggregate on a map representation.
     *
     * [lat] and [lng] are generated from [app.burrow.features.burrows.models.Burrow.location] in [burrow].
     *
     * @param burrow The Burrow itself.
     * @param lat The latitude of the location.
     * @param lng The longitude of the location.
     */
    @Serializable
    data class BurrowLocation(
        override val type: String = "BurrowLocation",
        val burrow: Burrow,
        override val lat: Double,
        override val lng: Double
    ) : Location()

    /**
     * A general location for specific amenities or points of interest.
     *
     * @param name The name of the location (e.g., "Wilson Library Study Room").
     * @param locationType The type of location (parking, vending, study, etc.).
     * @param lat The latitude of the location.
     * @param lng The longitude of the location.
     * @param description Optional description with additional details.
     */
    @Serializable
    data class GeneralLocation(
        override val type: String = "GeneralLocation",
        val name: String,
        val locationType: LocationType,
        override val lat: Double,
        override val lng: Double,
        val description: String? = null
    ) : Location()
}

/**
 * Cache of the geocode cache. A location name, like "Lind Hall" to it's Pair<lat, lng> or null if
 * it doesn't exist.
 */
private var geocodeCache: HashMap<String, Pair<Double, Double>?> = hashMapOf()

/** Google Geocoding API response structures */
@Serializable
private data class GeocodeResponse(val results: List<GeocodeResult>, val status: String)

@Serializable private data class GeocodeResult(val geometry: Geometry)

@Serializable private data class Geometry(val location: LatLng)

@Serializable private data class LatLng(val lat: Double, val lng: Double)

/** HTTP client for geocoding requests */
private val httpClient =
    HttpClient(CIO) { install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) } }

/** Google Maps API key */
private val GOOGLE_MAPS_API_KEY = env("GMAP_API") ?: ""

private val logger: Logger = LoggerFactory.getLogger("BurrowMap")

/**
 * Geocode a location string to latitude and longitude using Google's Geocoding API.
 *
 * @param location The location string to geocode.
 * @return A pair of (latitude, longitude) or null if geocoding fails.
 */
private suspend fun geocodeLocation(location: String): Pair<Double, Double>? {
    return when {
        location.isBlank() -> null

        geocodeCache.containsKey(location) -> {
            var (lat, lng) = geocodeCache[location] ?: return null

            // if a bunch of burrows have the same location, make it a bit
            // random so they're not stacked on each other
            lat += Random.nextDouble(-0.0002, 0.0002)
            lng += Random.nextDouble(-0.0002, 0.0002)

            lat to lng
        }

        else ->
            try {
                val url =
                    "https://maps.googleapis.com/maps/api/geocode/json" +
                        "?address=${URLEncoder.encode(location, "UTF-8")}" +
                        "&key=$GOOGLE_MAPS_API_KEY"

                logger.debug("Requesting GMap API for $location")

                val response: GeocodeResponse = httpClient.get(url).body()

                if (response.status == "OK" && response.results.isNotEmpty()) {
                    val result = response.results.first()
                    val loc = Pair(result.geometry.location.lat, result.geometry.location.lng)

                    geocodeCache[location] = loc

                    loc
                } else {
                    geocodeCache[location] = null

                    null
                }
            } catch (_: Exception) {
                null
            }
    }
}

private const val MN_MIN_LAT = 43.5
private const val MN_MAX_LAT = 49.4
private const val MN_MIN_LNG = -97.2
private const val MN_MAX_LNG = -89.5

/**
 * Check if coordinates are within Minnesota.
 *
 * @param lat The latitude.
 * @param lng The longitude.
 * @return True if the coordinates are within Minnesota's boundaries.
 */
private fun isInMinnesota(lat: Double, lng: Double): Boolean {
    return lat in MN_MIN_LAT..MN_MAX_LAT && lng in MN_MIN_LNG..MN_MAX_LNG
}

/**
 * Get all burrows with their geocoded locations.
 *
 * @param requestingUserID The ID of the user requesting the map, used to filter blocked users.
 * @return A list of [Location.BurrowLocation] for all burrows that could be successfully geocoded and are
 *   located within Minnesota.
 */
suspend fun getMap(requestingUserID: String?): List<Location.BurrowLocation> {
    // get blocked users if requesting user is provided
    val blockedUsers =
        if (requestingUserID != null) getAllBlockedRelationships(requestingUserID) else emptySet()

    // get all burrows that are active, excluding those from blocked users
    val allBurrows = query {
        Burrows.selectAll()
            .where { Burrows.endTime greaterEq getTimeMillis() }
            .toList()
            .map {  row -> row.toEntity<Burrow>(Burrows) }
            .filter { it.ownerID !in blockedUsers }
    }

    // geocode all burrows and filter to only Minnesota locations
    val burrowLocations =
        allBurrows.mapNotNull { burrow ->
            val coordinates = geocodeLocation(burrow.location)

            if (coordinates != null && isInMinnesota(coordinates.first, coordinates.second)) {
                Location.BurrowLocation(
                    burrow = burrow,
                    lat = coordinates.first,
                    lng = coordinates.second
                )
            } else {
                null
            }
        }

    return burrowLocations
}
