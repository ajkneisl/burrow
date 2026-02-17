package app.burrow

import app.burrow.features.account.profile.Profile
import app.burrow.api.Error
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.string.shouldContain

/**
 * Test suite for Profile validation, specifically focusing on major and school validation against
 * majors.json
 */
class ProfileValidationTest :
    FunSpec({
        // Helper to create a valid profile
        fun createValidProfile(
            school: String? = null,
            major: String? = null,
        ): Profile =
            Profile(
                userID = "test-user-123",
                name = "Test User",
                visibility = Profile.Visibility.PUBLIC,
                bio = "Test bio",
                gradYear = 2025,
                classes = listOf("CSCI 2021", "MATH 1271"),
                school = school,
                major = major,
                phoneNumber = "+1 (234) 567-8900",
                instagram = "@testuser",
                linkedIn = "testuser",
            )

        // ========================================
        // School Validation Tests
        // ========================================

        test("should accept valid school - College of Science and Engineering") {
            val profile = createValidProfile(school = "College of Science and Engineering")
            profile.validate() // Should not throw
        }

        test("should accept valid school - Carlson School of Management") {
            val profile = createValidProfile(school = "Carlson School of Management")
            profile.validate() // Should not throw
        }

        test("should accept valid school - College of Liberal Arts") {
            val profile = createValidProfile(school = "College of Liberal Arts")
            profile.validate() // Should not throw
        }

        test("should accept null school") {
            val profile = createValidProfile(school = null)
            profile.validate() // Should not throw
        }

        test("should reject invalid school name") {
            val profile = createValidProfile(school = "Invalid School Name")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid school"
        }

        test("should reject partial school name") {
            val profile = createValidProfile(school = "College of Science")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid school"
        }

        test("should reject school with typo") {
            val profile = createValidProfile(school = "Collage of Science and Engineering")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid school"
        }

        // ========================================
        // Major Validation Tests
        // ========================================

        test("should accept valid major - Computer Science") {
            val profile = createValidProfile(major = "Computer Science")
            profile.validate() // Should not throw
        }

        test("should accept valid major - Mechanical Engineering") {
            val profile = createValidProfile(major = "Mechanical Engineering")
            profile.validate() // Should not throw
        }

        test("should accept valid major - Psychology") {
            val profile = createValidProfile(major = "Psychology")
            profile.validate() // Should not throw
        }

        test("should accept valid major - Accounting") {
            val profile = createValidProfile(major = "Accounting")
            profile.validate() // Should not throw
        }

        test("should accept valid major - Nursing") {
            val profile = createValidProfile(major = "Nursing")
            profile.validate() // Should not throw
        }

        test("should accept valid major - Undecided") {
            val profile = createValidProfile(major = "Undecided")
            profile.validate() // Should not throw
        }

        test("should accept null major") {
            val profile = createValidProfile(major = null)
            profile.validate() // Should not throw
        }

        test("should reject invalid major name") {
            val profile = createValidProfile(major = "Basket Weaving")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid major"
        }

        test("should reject major with typo") {
            val profile = createValidProfile(major = "Compter Science")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid major"
        }

        test("should reject partial major name") {
            val profile = createValidProfile(major = "Computer")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid major"
        }

        // ========================================
        // Combined School and Major Tests
        // ========================================

        test("should accept both valid school and major") {
            val profile =
                createValidProfile(
                    school = "College of Science and Engineering",
                    major = "Computer Science",
                )
            profile.validate() // Should not throw
        }

        test("should accept valid school with null major") {
            val profile = createValidProfile(school = "College of Liberal Arts", major = null)
            profile.validate() // Should not throw
        }

        test("should accept null school with valid major") {
            val profile = createValidProfile(school = null, major = "Biology")
            profile.validate() // Should not throw
        }

        test("should accept both null school and major") {
            val profile = createValidProfile(school = null, major = null)
            profile.validate() // Should not throw
        }

        test("should reject invalid school even with valid major") {
            val profile =
                createValidProfile(school = "Invalid School", major = "Computer Science")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid school"
        }

        test("should reject invalid major even with valid school") {
            val profile =
                createValidProfile(
                    school = "College of Science and Engineering",
                    major = "Invalid Major",
                )
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid major"
        }

        // ========================================
        // Edge Cases and Special Majors
        // ========================================

        test("should accept major from multiple colleges - Astrophysics in CSE") {
            val profile = createValidProfile(major = "Astrophysics")
            profile.validate() // Should not throw (appears in both CSE and CLA)
        }

        test("should accept major from multiple colleges - Mathematics") {
            val profile = createValidProfile(major = "Mathematics")
            profile.validate() // Should not throw (appears in both CSE and CLA)
        }

        test("should accept cross-college major - Construction Management") {
            val profile = createValidProfile(major = "Construction Management")
            profile.validate() // Should not throw
        }

        test("should accept major with special characters - Finance & Risk Management Insurance") {
            val profile = createValidProfile(major = "Finance & Risk Management Insurance")
            profile.validate() // Should not throw
        }

        test("should accept major with comma - Sociology of Law, Criminology, and Justice") {
            val profile =
                createValidProfile(major = "Sociology of Law, Criminology, and Justice")
            profile.validate() // Should not throw
        }

        // ========================================
        // Case Sensitivity Tests
        // ========================================

        test("should reject lowercase school name") {
            val profile = createValidProfile(school = "college of science and engineering")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid school"
        }

        test("should reject uppercase school name") {
            val profile = createValidProfile(school = "COLLEGE OF SCIENCE AND ENGINEERING")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid school"
        }

        test("should reject lowercase major name") {
            val profile = createValidProfile(major = "computer science")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid major"
        }

        test("should reject uppercase major name") {
            val profile = createValidProfile(major = "COMPUTER SCIENCE")
            val exception = shouldThrow<Error> { profile.validate() }
            exception.message shouldContain "Invalid major"
        }

        // ========================================
        // All Schools Coverage Tests
        // ========================================

        test("should accept all valid schools") {
            val schools =
                listOf(
                    "Undecided",
                    "College of Science and Engineering",
                    "College of Biological Sciences",
                    "Carlson School of Management",
                    "College of Liberal Arts",
                    "College of Food, Agricultural and Natural Resource Sciences",
                    "College of Design",
                    "College of Education and Human Development",
                    "School of Public Health",
                    "School of Nursing",
                    "College of Continuing and Professional Studies",
                    "School of Dentistry",
                    "School of Public Affairs",
                    "Multiple Colleges/Cross-College Programs",
                )

            for (school in schools) {
                val profile = createValidProfile(school = school)
                profile.validate() // Should not throw
            }
        }

        // ========================================
        // Sample Majors from Each School
        // ========================================

        test("should accept majors from College of Biological Sciences") {
            val majors = listOf("Biochemistry", "Biology", "Neuroscience", "Microbiology")
            for (major in majors) {
                val profile = createValidProfile(major = major)
                profile.validate() // Should not throw
            }
        }

        test("should accept majors from Carlson School of Management") {
            val majors = listOf("Accounting", "Finance", "Marketing", "Business Analytics")
            for (major in majors) {
                val profile = createValidProfile(major = major)
                profile.validate() // Should not throw
            }
        }

        test("should accept majors from College of Design") {
            val majors =
                listOf("Architecture", "Graphic Design", "Interior Design", "Product Design")
            for (major in majors) {
                val profile = createValidProfile(major = major)
                profile.validate() // Should not throw
            }
        }
    })
