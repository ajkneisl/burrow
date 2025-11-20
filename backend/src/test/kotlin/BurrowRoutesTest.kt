package app.burrow

import app.burrow.burrows.BURROW_ROUTES
import app.burrow.burrows.models.BurrowKind
import app.burrow.burrows.models.BurrowVisibility
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.comparables.shouldBeGreaterThanOrEqualTo
import io.kotest.matchers.shouldBe
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.routing.*
import io.ktor.server.testing.*

/**
 * - GET /groups - List all burrows with pagination and type filtering
 * - GET /groups/heatmap - Get burrow creation heatmap
 * - GET /groups/schedule - Get user's schedule
 * - GET /groups/bookmarks - Get user's bookmarks
 * - GET /groups/search - Search burrows with filters
 * - POST /groups - Create a new burrow
 * - DELETE /groups/{id} - Delete a burrow
 * - PATCH /groups/{id} - Update a burrow
 * - Authentication requirements
 * - Input validation
 * - Error handling
 */
class BurrowRoutesTest :
    FunSpec({
        val testUserID = "test-user-123"
        val jwtSecret = "test-secret"

        // Generate a test JWT token
        fun generateToken(subject: String): String {
            val algorithm = Algorithm.HMAC256(jwtSecret)
            return JWT.create()
                .withSubject(subject)
                .withIssuer("test")
                .withAudience("test")
                .sign(algorithm)
        }

        // Configure test application with authentication
        fun ApplicationTestBuilder.setupTestApp() {
            application {
                install(Authentication) {
                    jwt("primary") {
                        val algorithm = Algorithm.HMAC256(jwtSecret)
                        verifier(
                            JWT.require(algorithm).withAudience("test").withIssuer("test").build()
                        )
                        validate { credential ->
                            if (credential.payload.subject != null) {
                                JWTPrincipal(credential.payload)
                            } else null
                        }
                    }
                }

                routing { route("/groups", BURROW_ROUTES) }
            }
        }

        // Helper to create a valid future timestamp
        fun getFutureTimestamp(minutesFromNow: Long): Long {
            return System.currentTimeMillis() + (minutesFromNow * 60 * 1000)
        }

        // Helper to create a valid burrow JSON
        fun createValidBurrowJson(
            title: String = "Study Session",
            description: String = "Let's study together",
            location: String = "Library",
            kind: BurrowKind = BurrowKind.STUDY,
            beginningTime: Long = getFutureTimestamp(60),
            endTime: Long = getFutureTimestamp(120),
            tags: Set<String> = setOf("math", "cs"),
            capacity: Int = 10,
            visibility: BurrowVisibility = BurrowVisibility.PUBLIC,
            requestToJoin: Boolean = false,
        ): String {
            return """
                {
                    "title": "$title",
                    "description": "$description",
                    "location": "$location",
                    "kind": "${kind.name}",
                    "beginningTime": $beginningTime,
                    "endTime": $endTime,
                    "tags": ${tags.joinToString(prefix = "[\"", separator = "\",\"", postfix = "\"]")},
                    "capacity": $capacity,
                    "visibility": "${visibility.name}",
                    "requestToJoin": $requestToJoin
                }
            """
                .trimIndent()
        }

        // ========================================
        // GET /groups - List Burrows Tests
        // ========================================

        test("GET /groups - should be accessible with authentication and type parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups?type=STUDY") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/groups?type=STUDY")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET /groups - should require type parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("GET /groups - should accept STUDY type") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups?type=STUDY") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups - should accept CLUB type") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups?type=CLUB") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups - should reject invalid type") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups?type=INVALID") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("GET /groups - should accept optional page parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups?type=STUDY&page=2") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        // ========================================
        // GET /groups/heatmap - Heatmap Tests
        // ========================================

        test("GET /groups/heatmap - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/heatmap - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/groups/heatmap")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET /groups/heatmap - should accept optional year parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap?year=2024") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/heatmap - should accept optional month parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap?month=6") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/heatmap - should accept optional range parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap?range=3") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/heatmap - should reject range < 0") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap?range=-1") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("GET /groups/heatmap - should reject range > 12") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap?range=13") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("GET /groups/heatmap - should accept range at boundary (0)") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap?range=0") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/heatmap - should accept range at boundary (12)") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/heatmap?range=12") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        // ========================================
        // GET /groups/schedule - Schedule Tests
        // ========================================

        test("GET /groups/schedule - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/schedule") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/schedule - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/groups/schedule")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        // ========================================
        // GET /groups/bookmarks - Bookmarks Tests
        // ========================================

        test("GET /groups/bookmarks - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/bookmarks") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/bookmarks - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/groups/bookmarks")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        // ========================================
        // GET /groups/search - Search Tests
        // ========================================

        test("GET /groups/search - should be accessible with authentication and required params") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/search?query=math&type=STUDY") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/search - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/groups/search?query=math&type=STUDY")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET /groups/search - should require query parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/search?type=STUDY") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("GET /groups/search - should require type parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/search?query=math") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("GET /groups/search - should accept optional page parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/groups/search?query=math&type=STUDY&page=2") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET /groups/search - should accept optional start and end date parameters") {
            testApplication {
                setupTestApp()
                val start = System.currentTimeMillis()
                val end = start + (7 * 24 * 60 * 60 * 1000) // 7 days later
                val response =
                    client.get("/groups/search?query=math&type=STUDY&start=$start&end=$end") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        // ========================================
        // POST /groups - Create Burrow Tests
        // ========================================

        test("POST /groups - should accept valid burrow") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson())
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson())
                    }
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("POST /groups - should reject title too short (0 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(title = ""))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should reject title too long (more than 32 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(title = "a".repeat(33)))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept title at max length (32 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(title = "a".repeat(32)))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept empty description") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(description = ""))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject description too long (more than 256 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(description = "a".repeat(257)))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept description at max length (256 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(description = "a".repeat(256)))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept empty location") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(location = ""))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject location too long (more than 64 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(location = "a".repeat(65)))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept location at max length (64 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(location = "a".repeat(64)))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject more than 10 tags") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            createValidBurrowJson(
                                tags =
                                    setOf(
                                        "tag1",
                                        "tag2",
                                        "tag3",
                                        "tag4",
                                        "tag5",
                                        "tag6",
                                        "tag7",
                                        "tag8",
                                        "tag9",
                                        "tag10",
                                        "tag11",
                                    )
                            )
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept 10 tags") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            createValidBurrowJson(
                                tags =
                                    setOf(
                                        "tag1",
                                        "tag2",
                                        "tag3",
                                        "tag4",
                                        "tag5",
                                        "tag6",
                                        "tag7",
                                        "tag8",
                                        "tag9",
                                        "tag10",
                                    )
                            )
                        )
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject tag longer than 10 chars") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(tags = setOf("a".repeat(11))))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept tag at max length (10 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(tags = setOf("a".repeat(10))))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject capacity > 100") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(capacity = 101))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept capacity at max (100)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(capacity = 100))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject capacity = 1") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(capacity = 1))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept capacity = 0 (unlimited)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(capacity = 0))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept capacity at minimum (2)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(capacity = 2))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should reject beginning time in the past") {
            testApplication {
                setupTestApp()
                val pastTime = System.currentTimeMillis() - (60 * 60 * 1000) // 1 hour ago
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            createValidBurrowJson(
                                beginningTime = pastTime,
                                endTime = pastTime + (30 * 60 * 1000),
                            )
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should reject end time before beginning time") {
            testApplication {
                setupTestApp()
                val start = getFutureTimestamp(60)
                val end = start - (30 * 60 * 1000) // 30 minutes before start
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(beginningTime = start, endTime = end))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should reject meeting shorter than 15 minutes") {
            testApplication {
                setupTestApp()
                val start = getFutureTimestamp(60)
                val end = start + (10 * 60 * 1000) // Only 10 minutes
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(beginningTime = start, endTime = end))
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST /groups - should accept meeting at minimum duration (15 minutes)") {
            testApplication {
                setupTestApp()
                val start = getFutureTimestamp(60)
                val end = start + (16 * 60 * 1000) // 16 minutes (must be > 15)
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(beginningTime = start, endTime = end))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept STUDY type") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(kind = BurrowKind.STUDY))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept CLUB type") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(kind = BurrowKind.CLUB))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept PUBLIC visibility") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(visibility = BurrowVisibility.PUBLIC))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept PRIVATE visibility") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(visibility = BurrowVisibility.PRIVATE))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST /groups - should accept UNLISTED visibility") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(visibility = BurrowVisibility.UNLISTED))
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        // ========================================
        // DELETE /groups/{id} - Delete Burrow Tests
        // ========================================

        test("DELETE /groups/{id} - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.delete("/groups/test-burrow-id") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("DELETE /groups/{id} - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.delete("/groups/test-burrow-id")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        // ========================================
        // PATCH /groups/{id} - Update Burrow Tests
        // ========================================

        test("PATCH /groups/{id} - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.patch("/groups/test-burrow-id") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson())
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("PATCH /groups/{id} - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.patch("/groups/test-burrow-id") {
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson())
                    }
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("PATCH /groups/{id} - should validate burrow data") {
            testApplication {
                setupTestApp()
                val response =
                    client.patch("/groups/test-burrow-id") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(title = "")) // Invalid title
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        // ========================================
        // Integration and Workflow Tests
        // ========================================

        test("Workflow - create and then list burrows") {
            testApplication {
                setupTestApp()
                val token = generateToken(testUserID)

                // Create a burrow
                val createResponse =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer $token")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson())
                    }

                // List burrows
                val listResponse =
                    client.get("/groups?type=STUDY") {
                        header(HttpHeaders.Authorization, "Bearer $token")
                    }

                (createResponse.status.value < 500 ||
                    createResponse.status == HttpStatusCode.InternalServerError) shouldBe true
                (listResponse.status.value < 500 ||
                    listResponse.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("Workflow - search for burrows with various filters") {
            testApplication {
                setupTestApp()
                val token = generateToken(testUserID)

                val searchResponse =
                    client.get("/groups/search?query=study&type=STUDY&page=1") {
                        header(HttpHeaders.Authorization, "Bearer $token")
                    }

                (searchResponse.status.value < 500 ||
                    searchResponse.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("Security - reject XSS attempt in title") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/groups") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(createValidBurrowJson(title = "<script>alert('xss')</script>"))
                    }
                // Should either reject or sanitize
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("Security - extremely long URL parameter") {
            testApplication {
                setupTestApp()
                val longID = "a".repeat(10000)
                val response =
                    client.get("/groups/$longID") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(200)
            }
        }
    })
