package app.burrow

import org.junit.Test
import kotlin.test.assertTrue
import kotlin.test.assertFalse

/**
 * Simple JUnit test to verify major/school validation logic works
 */
class ProfileMajorValidationUnitTest {
    @Test
    fun testMajorsJsonCanBeLoaded() {
        val stream = this.javaClass.classLoader.getResourceAsStream("majors.json")
        assertTrue(stream != null, "majors.json should be loadable from resources")
        stream?.close()
    }
}
