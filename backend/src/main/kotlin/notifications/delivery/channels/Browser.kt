package app.burrow.notifications.delivery.channels

import app.burrow.notifications.delivery.Delivery
import app.burrow.notifications.delivery.DeliveryChannel

/** Delivering notifications through a browser. */
object Browser : DeliveryChannel {
    // TODO
    override val onDelivery: Delivery = {
        true
    }
}
