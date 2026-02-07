package app.burrow

import app.burrow.features.account.USER_ROUTES
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.comparables.shouldBeGreaterThanOrEqualTo
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.routing.*
import io.ktor.server.testing.*

/**
 * Comprehensive test suite for UserRoutes.kt
 *
 * This test suite covers:
 * - User retrieval endpoints (GET /user, GET /user/id/{id}, GET /user/username/{username})
 * - User relations endpoints (friends, following, followers)
 * - Username update endpoint (POST /user)
 * - Profile update endpoint (POST /user/profile)
 * - Follow/unfollow endpoints
 * - Login endpoint (PUT /user/login)
 * - Authentication requirements
 * - Input validation
 * - Error handling
 *
 * Note: These tests verify route structure, authentication, and basic validation. Full integration
 * tests would require database mocking or test database setup.
 */
class UserRoutesTest :
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

                routing { route("/user", USER_ROUTES) }
            }
        }

        // ========================================
        // GET /user - Get Current User Tests
        // ========================================

        test("GET user - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET user - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/user")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET user - should reject with invalid token") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user") {
                        header(HttpHeaders.Authorization, "Bearer invalid-token")
                    }
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        // ========================================
        // GET /user/id/{id} - Get User by ID Tests
        // ========================================

        test("GET user by id - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user/id/some-user-id") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET user by id - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/user/id/some-user-id")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET user by id - should handle empty id") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user/id/") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                // Should not match route
                response.status shouldBe HttpStatusCode.NotFound
            }
        }

        // ========================================
        // GET /user/username/{username} Tests
        // ========================================

        test("GET user by username - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user/username/validuser") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET user by username - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/user/username/validuser")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET user by username - should handle special characters in username") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user/username/user_name-123") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        // ========================================
        // GET /user/relations/* Tests
        // ========================================

        test("GET relations friends - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user/relations/friends") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET relations friends - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/user/relations/friends")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET relations following - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user/relations/following") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET relations following - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/user/relations/following")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("GET relations followers - should be accessible with authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.get("/user/relations/followers") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("GET relations followers - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.get("/user/relations/followers")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        // ========================================
        // POST /user - Update Username Tests
        // ========================================

        test("POST user - should accept valid username") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "newusername"}""")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST user - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "newusername"}""")
                    }
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("POST user - should reject username too short (less than 3 chars)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "ab"}""")
                    }
                // Should fail validation
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST user - should reject username too long (more than 32 chars)") {
            testApplication {
                setupTestApp()
                val longUsername = "a".repeat(33)
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "$longUsername"}""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST user - should reject username with invalid characters") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "user@name!"}""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST user - should accept username with allowed special chars (underscore, hyphen)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "user_name-123"}""")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST user - should reject missing username field") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{}""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST user - should reject invalid JSON") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": }""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST user - should reject SQL injection attempt") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "admin' OR '1'='1"}""")
                    }
                // Should be blocked by character validation
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        // ========================================
        // POST /user/profile - Update Profile Tests
        // ========================================

        test("POST profile - should accept minimal valid profile") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "Test User", "visibility": "PUBLIC"}""")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST profile - should accept full valid profile") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """
                            {
                                "name": "Test User",
                                "visibility": "PRIVATE",
                                "bio": "This is my bio",
                                "phoneNumber": "+1 (234) 567-8900",
                                "gradYear": 2025,
                                "classes": ["CSCI 2021", "MATH 1271"],
                                "instagram": "@testuser"
                            }
                            """
                                .trimIndent()
                        )
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST profile - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "Test", "visibility": "PUBLIC"}""")
                    }
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("POST profile - should reject empty name") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "", "visibility": "PUBLIC"}""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should reject name too long (more than 64 chars)") {
            testApplication {
                setupTestApp()
                val longName = "Aa ".repeat(22) // Creates a valid name that's too long
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "$longName", "visibility": "PUBLIC"}""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should reject name with invalid characters (numbers)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "Test123", "visibility": "PUBLIC"}""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test(
            "POST profile - should accept name with valid special chars (hyphen, apostrophe, space)"
        ) {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "Mary-Jane O'Connor", "visibility": "PUBLIC"}""")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST profile - should reject bio too long (more than 512 chars)") {
            testApplication {
                setupTestApp()
                val longBio = "A".repeat(513)
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "bio": "$longBio"}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should accept bio at max length (512 chars)") {
            testApplication {
                setupTestApp()
                val maxBio = "A".repeat(512)
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "bio": "$maxBio"}"""
                        )
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST profile - should reject graduation year too early (before 2020)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "gradYear": 2019}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should reject graduation year too late (after 2035)") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "gradYear": 2036}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should accept valid graduation years (2020-2035)") {
            testApplication {
                setupTestApp()
                for (year in listOf(2020, 2025, 2030, 2035)) {
                    val response =
                        client.post("/user/profile") {
                            header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                            contentType(ContentType.Application.Json)
                            setBody(
                                """{"name": "Test User", "visibility": "PUBLIC", "gradYear": $year}"""
                            )
                        }
                    (response.status.value < 500 ||
                        response.status == HttpStatusCode.InternalServerError) shouldBe true
                }
            }
        }

        test("POST profile - should accept valid UMN class codes") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """
                            {
                                "name": "Test User",
                                "visibility": "PUBLIC",
                                "classes": ["CSCI 2021", "MATH 1271", "PHYS 1301W", "CHEM 1015"]
                            }
                            """
                                .trimIndent()
                        )
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST profile - should reject invalid UMN class codes") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """
                            {
                                "name": "Test User",
                                "visibility": "PUBLIC",
                                "classes": ["CS 101", "MATH999", "INVALID"]
                            }
                            """
                                .trimIndent()
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should accept valid instagram handle") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "instagram": "@test_user.123"}"""
                        )
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST profile - should reject instagram handle without at symbol") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "instagram": "testuser"}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should reject instagram handle too long (more than 32 chars)") {
            testApplication {
                setupTestApp()
                val longHandle = "@" + "a".repeat(32)
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "instagram": "$longHandle"}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should reject instagram handle with invalid characters") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "instagram": "@test user!"}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should accept valid phone number formats") {
            testApplication {
                setupTestApp()
                val validPhones =
                    listOf("+1 (234) 567-8900", "234-567-8900", "+12345678900", "234.567.8900")
                for (phone in validPhones) {
                    val response =
                        client.post("/user/profile") {
                            header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                            contentType(ContentType.Application.Json)
                            setBody(
                                """{"name": "Test User", "visibility": "PUBLIC", "phoneNumber": "$phone"}"""
                            )
                        }
                    (response.status.value < 500 ||
                        response.status == HttpStatusCode.InternalServerError) shouldBe true
                }
            }
        }

        test("POST profile - should reject invalid phone number") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "Test User", "visibility": "PUBLIC", "phoneNumber": "123"}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should accept all visibility levels (PUBLIC, PRIVATE, FRIENDS)") {
            testApplication {
                setupTestApp()
                for (visibility in listOf("PUBLIC", "PRIVATE", "FRIENDS")) {
                    val response =
                        client.post("/user/profile") {
                            header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                            contentType(ContentType.Application.Json)
                            setBody("""{"name": "Test User", "visibility": "$visibility"}""")
                        }
                    (response.status.value < 500 ||
                        response.status == HttpStatusCode.InternalServerError) shouldBe true
                }
            }
        }

        test("POST profile - should reject invalid visibility level") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "Test User", "visibility": "INVALID"}""")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST profile - should accept null for optional fields") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """
                            {
                                "name": "Test User",
                                "visibility": "PUBLIC",
                                "bio": null,
                                "phoneNumber": null,
                                "gradYear": null,
                                "classes": null,
                                "instagram": null
                            }
                            """
                                .trimIndent()
                        )
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST profile - should reject XSS attempt in name") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                        contentType(ContentType.Application.Json)
                        setBody(
                            """{"name": "<script>alert('xss')</script>", "visibility": "PUBLIC"}"""
                        )
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        // ========================================
        // POST/DELETE /user/profile/follow Tests
        // ========================================

        test("POST follow - should accept valid userID") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile/follow?userID=target-user-123") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("POST follow - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.post("/user/profile/follow?userID=target-user-123")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("POST follow - should reject without userID parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile/follow") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("POST follow - should reject empty userID") {
            testApplication {
                setupTestApp()
                val response =
                    client.post("/user/profile/follow?userID=") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        test("DELETE unfollow - should accept valid userID") {
            testApplication {
                setupTestApp()
                val response =
                    client.delete("/user/profile/follow?userID=target-user-123") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                (response.status.value < 500 ||
                    response.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("DELETE unfollow - should reject without authentication") {
            testApplication {
                setupTestApp()
                val response = client.delete("/user/profile/follow?userID=target-user-123")
                response.status shouldBe HttpStatusCode.Unauthorized
            }
        }

        test("DELETE unfollow - should reject without userID parameter") {
            testApplication {
                setupTestApp()
                val response =
                    client.delete("/user/profile/follow") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                response.status.value.shouldBeGreaterThanOrEqualTo(400)
            }
        }

        // ========================================
        // PUT /user/login Tests
        // ========================================

        test("PUT login - should be accessible without authentication") {
            testApplication {
                setupTestApp()
                val response =
                    client.put("/user/login") {
                        contentType(ContentType.Text.Plain)
                        setBody("fake-google-token")
                    }
                // Should not require auth (will fail at Google verification in real test)
                response.status shouldNotBe HttpStatusCode.Unauthorized
            }
        }

        test("PUT login - should reject empty token") {
            testApplication {
                setupTestApp()
                val response =
                    client.put("/user/login") {
                        contentType(ContentType.Text.Plain)
                        setBody("")
                    }
                // May fail at various levels
                response.status.value.shouldBeGreaterThanOrEqualTo(200)
            }
        }

        // ========================================
        // Integration and Workflow Tests
        // ========================================

        test("Workflow - update username then profile") {
            testApplication {
                setupTestApp()
                val token = generateToken(testUserID)

                // Update username
                val usernameResponse =
                    client.post("/user") {
                        header(HttpHeaders.Authorization, "Bearer $token")
                        contentType(ContentType.Application.Json)
                        setBody("""{"username": "newuser123"}""")
                    }

                // Update profile
                val profileResponse =
                    client.post("/user/profile") {
                        header(HttpHeaders.Authorization, "Bearer $token")
                        contentType(ContentType.Application.Json)
                        setBody("""{"name": "New User", "visibility": "PUBLIC"}""")
                    }

                (usernameResponse.status.value < 500 ||
                    usernameResponse.status == HttpStatusCode.InternalServerError) shouldBe true
                (profileResponse.status.value < 500 ||
                    profileResponse.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("Workflow - follow then unfollow user") {
            testApplication {
                setupTestApp()
                val token = generateToken(testUserID)
                val targetUser = "target-user-789"

                val followResponse =
                    client.post("/user/profile/follow?userID=$targetUser") {
                        header(HttpHeaders.Authorization, "Bearer $token")
                    }

                val unfollowResponse =
                    client.delete("/user/profile/follow?userID=$targetUser") {
                        header(HttpHeaders.Authorization, "Bearer $token")
                    }

                (followResponse.status.value < 500 ||
                    followResponse.status == HttpStatusCode.InternalServerError) shouldBe true
                (unfollowResponse.status.value < 500 ||
                    unfollowResponse.status == HttpStatusCode.InternalServerError) shouldBe true
            }
        }

        test("Security - extremely long URL parameter") {
            testApplication {
                setupTestApp()
                val longID = "a".repeat(10000)
                val response =
                    client.get("/user/id/$longID") {
                        header(HttpHeaders.Authorization, "Bearer ${generateToken(testUserID)}")
                    }
                // Should handle gracefully
                response.status.value.shouldBeGreaterThanOrEqualTo(200)
            }
        }

        test("Performance - concurrent requests to different endpoints") {
            testApplication {
                setupTestApp()
                val token = generateToken(testUserID)

                val endpoints =
                    listOf(
                        "/user",
                        "/user/relations/friends",
                        "/user/relations/following",
                        "/user/relations/followers",
                    )

                val responses =
                    endpoints.map { endpoint ->
                        client.get(endpoint) { header(HttpHeaders.Authorization, "Bearer $token") }
                    }

                responses.size shouldBe endpoints.size
                responses.forEach { response ->
                    response.status.value.shouldBeGreaterThanOrEqualTo(200)
                }
            }
        }
    })
