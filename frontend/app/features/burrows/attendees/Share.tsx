import { Button, Modal } from "@components/core"
import { Platform, Pressable, Share as RNShare, Text, View } from "react-native"
import QRCode from "react-native-qrcode-svg"
import { QrCode, Share2 } from "lucide-react-native"
import { useRef, useState } from "react"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import Toast from "react-native-toast-message"
import ThemedIcon from "@components/core/ThemedIcon"

/**
 * {@link Share}
 */
type ShareProps = {
    burrowID: string
    title: string
}

/**
 * The functionality of sharing a Burrow.
 *
 * This contains a regular share button, which contains the URL of the Burrow,
 * as well as the ability to create a QR code :)
 *
 * @param burrowID The ID of the Burrow.
 * @param title The title of the Burrow.
 *
 * @author AJ Kneisl
 */
export default function Share({ burrowID, title }: ShareProps) {
    const qrRef = useRef<any>(null)

    const [qrModalOpen, setQrModalOpen] = useState(false)

    // when the user presses regular share
    const handleShare = async () => {
        const url = `https://umn.app/${burrowID}`

        try {
            await RNShare.share(
                Platform.OS === "android"
                    ? {
                          message: `Check out this Burrow: ${title}\n${url}`
                      }
                    : {
                          message: `Check out this Burrow: ${title}`,
                          url
                      }
            )
        } catch {}
    }

    // when the user presses QR share
    const handleQrShare = async () => {
        if (!qrRef.current) return

        try {
            qrRef.current.toDataURL(async (dataURL: string) => {
                const filename = `${FileSystem.cacheDirectory}burrow-qr-${burrowID}.png`
                await FileSystem.writeAsStringAsync(filename, dataURL, {
                    encoding: FileSystem.EncodingType.Base64
                })

                const isAvailable = await Sharing.isAvailableAsync()
                if (isAvailable) {
                    await Sharing.shareAsync(filename, {
                        mimeType: "image/png",
                        dialogTitle: `Share ${title} QR Code`
                    })
                }
            })
        } catch {
            Toast.show({
                type: "error",
                text1: "Failed to share QR code"
            })
        }
    }

    return (
        <>
            {/* buttons */}
            <View className="flex-row items-center gap-2">
                <Pressable onPress={() => setQrModalOpen(true)} className="p-2">
                    <ThemedIcon icon={QrCode} size={24} />
                </Pressable>

                <Pressable onPress={handleShare} className="p-2 -mr-2">
                    <ThemedIcon icon={Share2} size={24} />
                </Pressable>
            </View>

            {/* qr code modal */}
            <Modal
                visible={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                title="Share via QR Code"
                size="md"
                scrollable={false}
                centered
            >
                <View className="items-center">
                    <Text className="text-sm text-text text-opacity-60 mb-6 text-center">
                        Scan to open this Burrow
                    </Text>

                    <View
                        className="p-4 rounded-2xl mb-6"
                        style={{ backgroundColor: "#FFFFFF" }}
                    >
                        <QRCode
                            value={`https://umn.app/${burrowID}`}
                            size={200}
                            logo={require("@assets/images/burrow.png")}
                            logoSize={50}
                            logoBackgroundColor="#FFFFFF"
                            logoMargin={4}
                            logoBorderRadius={8}
                            getRef={(ref) => (qrRef.current = ref)}
                        />
                    </View>

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={<Share2 size={18} color="#FFFFFF" />}
                        onPress={handleQrShare}
                    >
                        Share QR Code
                    </Button>
                </View>
            </Modal>
        </>
    )
}
