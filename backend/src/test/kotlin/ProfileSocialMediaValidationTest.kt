package app.burrow

import app.burrow.features.account.profile.Profile
import app.burrow.api.Error
import io.kotest.assertions.throwables.shouldNotThrow
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.string.shouldContain
import kotlinx.coroutines.runBlocking

/**
 * Test suite for Profile social media validation (Instagram and LinkedIn)
 *
 * Note: These tests validate format and make real HTTP requests to verify profiles exist.
 * Some tests may be slow or flaky depending on network conditions.
 */
class ProfileSocialMediaValidationTest :
    FunSpec({
        // Helper to create a valid profile
        fun createValidProfile(
            instagram: String? = null,
            linkedIn: String? = null,
        ): Profile =
            Profile(
                userID = "test-user-123",
                name = "Test User",
                visibility = Profile.Visibility.PUBLIC,
                bio = "Test bio",
                gradYear = 2025,
                classes = listOf("CSCI 2021"),
                school = "College of Science and Engineering",
                major = "Computer Science",
                phoneNumber = "+1 (234) 567-8900",
                instagram = instagram,
                linkedIn = linkedIn,
            )

        // ========================================
        // Instagram Validation Tests
        // ========================================

        test("should accept null instagram") {
            val profile = createValidProfile(instagram = null)
            runBlocking { shouldNotThrow<Error> { profile.validate() } }
        }

        test("should reject instagram without @ prefix") {
            val profile = createValidProfile(instagram = "testuser")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "Instagram handle must start with '@'"
            }
        }

        test("should reject instagram that is too short") {
            val profile = createValidProfile(instagram = "@")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain
                    "Instagram handle must be between 1 and 32 characters"
            }
        }

        test("should reject instagram that is too long") {
            val profile = createValidProfile(instagram = "@${"a".repeat(32)}")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain
                    "Instagram handle must be between 1 and 32 characters"
            }
        }

        test("should accept instagram at max length (32 chars including @)") {
            // Note: This will try to verify the profile exists, which will likely fail
            // but we're testing the length validation here
            val profile = createValidProfile(instagram = "@${"a".repeat(31)}")
            runBlocking {
                // Should not throw length error, but may throw "does not exist" error
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "does not exist or could not be verified"
            }
        }

        test("should reject instagram with invalid characters - spaces") {
            val profile = createValidProfile(instagram = "@test user")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "Instagram handle contains invalid characters"
            }
        }

        test("should reject instagram with invalid characters - special symbols") {
            val profile = createValidProfile(instagram = "@test!user")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "Instagram handle contains invalid characters"
            }
        }

        test("should accept instagram with valid characters - underscores and dots") {
            // Note: This makes a real HTTP request to verify the profile
            val profile = createValidProfile(instagram = "@test_user.123")
            runBlocking {
                // May pass or fail depending on if this profile actually exists
                // We're mainly testing that it doesn't fail on character validation
                try {
                    profile.validate()
                } catch (e: Error) {
                    // If it fails, should be because profile doesn't exist, not invalid chars
                    e.message shouldContain "does not exist"
                }
            }
        }

        // ========================================
        // LinkedIn Validation Tests
        // ========================================

        test("should accept null linkedin") {
            val profile = createValidProfile(linkedIn = null)
            runBlocking { shouldNotThrow<Error> { profile.validate() } }
        }

        test("should reject blank linkedin") {
            val profile = createValidProfile(linkedIn = "")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "LinkedIn username must be between 1 and 64 characters"
            }
        }

        test("should reject linkedin that is too long") {
            val profile = createValidProfile(linkedIn = "a".repeat(65))
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "LinkedIn username must be between 1 and 64 characters"
            }
        }

        test("should accept linkedin at max length (64 chars)") {
            // Note: This will try to verify the profile exists
            val profile = createValidProfile(linkedIn = "a".repeat(64))
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "does not exist or could not be verified"
            }
        }

        test("should accept linkedin with valid characters - letters and numbers") {
            val profile = createValidProfile(linkedIn = "johndoe123")
            runBlocking {
                // May pass or fail depending on if this profile actually exists
                try {
                    profile.validate()
                } catch (e: Error) {
                    e.message shouldContain "does not exist"
                }
            }
        }

        test("should accept linkedin with valid characters - hyphens") {
            val profile = createValidProfile(linkedIn = "john-doe-123")
            runBlocking {
                try {
                    profile.validate()
                } catch (e: Error) {
                    e.message shouldContain "does not exist"
                }
            }
        }

        test("should reject linkedin with invalid characters - underscores") {
            val profile = createValidProfile(linkedIn = "john_doe")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "LinkedIn username contains invalid characters"
            }
        }

        test("should reject linkedin with invalid characters - spaces") {
            val profile = createValidProfile(linkedIn = "john doe")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "LinkedIn username contains invalid characters"
            }
        }

        test("should reject linkedin with invalid characters - special symbols") {
            val profile = createValidProfile(linkedIn = "john@doe")
            runBlocking {
                val exception = shouldThrow<Error> { profile.validate() }
                exception.message shouldContain "LinkedIn username contains invalid characters"
            }
        }

        // ========================================
        // Combined Tests
        // ========================================

        test("should validate both instagram and linkedin together") {
            val profile =
                createValidProfile(instagram = "@test_user", linkedIn = "test-user-123")
            runBlocking {
                // Both will be validated
                try {
                    profile.validate()
                } catch (e: Error) {
                    // Expected to fail since these profiles likely don't exist
                    e.message shouldContain "does not exist"
                }
            }
        }

        test("should accept both null instagram and linkedin") {
            val profile = createValidProfile(instagram = null, linkedIn = null)
            runBlocking { shouldNotThrow<Error> { profile.validate() } }
        }

        // ========================================
        // Edge Cases
        // ========================================

        test("should handle instagram with maximum valid special characters") {
            val profile = createValidProfile(instagram = "@test.user_123")
            runBlocking {
                try {
                    profile.validate()
                } catch (e: Error) {
                    // Should fail on existence check, not character validation
                    e.message shouldContain "does not exist"
                }
            }
        }

        test("should handle linkedin with multiple hyphens") {
            val profile = createValidProfile(linkedIn = "john-paul-doe")
            runBlocking {
                try {
                    profile.validate()
                } catch (e: Error) {
                    e.message shouldContain "does not exist"
                }
            }
        }

        // ========================================
        // Case Sensitivity Tests
        // ========================================

        test("should accept instagram with uppercase letters") {
            val profile = createValidProfile(instagram = "@TestUser123")
            runBlocking {
                try {
                    profile.validate()
                } catch (e: Error) {
                    e.message shouldContain "does not exist"
                }
            }
        }

        test("should accept linkedin with uppercase letters") {
            val profile = createValidProfile(linkedIn = "JohnDoe123")
            runBlocking {
                try {
                    profile.validate()
                } catch (e: Error) {
                    e.message shouldContain "does not exist"
                }
            }
        }
    })
