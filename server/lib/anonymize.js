import net from "net";
import ipAddress from "ip-address";


export default function anonymize(ip) {
    if (net.isIP(ip)) {
        const ipv4 = new ipAddress.Address4(ip + "/24");
        if (ipv4.isValid()) {
            return ipv4.startAddress().correctForm();
        }

        const ipv6 = new ipAddress.Address6(ip + "/48");
        if (ipv6.isValid()) {
            return ipv6.startAddress().correctForm();
        }
    }
    return ip;
}
