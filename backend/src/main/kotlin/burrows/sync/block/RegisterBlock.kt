package app.burrow.burrows.sync.block

import kotlin.reflect.KClass
import org.reflections.Reflections
import org.reflections.scanners.Scanners
import org.reflections.util.ClasspathHelper
import org.reflections.util.ConfigurationBuilder

/** A block that can be enabled/disabled in the context of a meeting. */
@MustBeDocumented
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class RegisterBlock

/** Find all registered blocks within Burrow. */
fun findRegisteredBlocks(): List<KClass<*>> {
    val result = mutableListOf<KClass<*>>()
    val urls = ClasspathHelper.forPackage("app.burrow")
    val config = ConfigurationBuilder().setUrls(urls).setScanners(Scanners.TypesAnnotated)
    val reflections = Reflections(config)

    val annotated: Set<Class<*>> =
        reflections.get(Scanners.TypesAnnotated.with(RegisterBlock::class.java).asClass<Any>())

    for (clazz in annotated) {
        result += clazz.kotlin
    }

    return result
}
