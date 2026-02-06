---
title: The Passenger
summary: The Passenger collaboration with Assim Kalouaz.
permalink: /passenger-collab
tags:
  - awe
  - assim-kalouaz
  - touch-designer
publishDate: 02/12/2025
---

[The Passenger](https://recreation.blue/passenger.html) was an evidence-based art installation and psychological experiment by Assim Kalouaz that tried to elicit 'awe' in participants. It took place at [École Supérieure du Digital](https://ecole-du-digital.com/). Michael Anslow collaborated on this installation. In particular, helping with the signal processing of breath oscillations and lighting.

You can read a bit about the psychological underpinnings of 'awe' used in the experiment [here](https://medium.com/@michael.anslow/the-light-and-dark-of-awe-5f4f02021fe2).

<LinkCard
  title="The Light and Dark of Awe - Part I"
  desc="An article on 'awe' written by Michael Anslow related to The Passenger installation."
  href="https://medium.com/@michael.anslow/the-light-and-dark-of-awe-5f4f02021fe2"
/>

## Photo Gallery

There are two [Pepper's ghost illusions](https://en.wikipedia.org/wiki/Pepper%27s_ghost)created by using transparent plastic screens below tablets against a screen projector. These illusions capture a person floating and a sphere. Four lights are positioned around the participant as well as stereo speakers on either side of the participant. The lights and Pepper's ghost illusions are modulated by breath. Content is shown in the projector and played on stereo speakers related to the theme of the experiment.

<div class="pswp-gallery gallery-custom" id="passanger-gallery">
  <a
    href="/static/the-passenger/passenger-atmosphere.jpeg"
    data-pswp-width="2048"
    data-pswp-height="1152"
  >
    <img src="/static/the-passenger/passenger-atmosphere.jpeg" alt="Passenger atmosphere" loading="lazy" />
    <span class="thumb-caption">Atmosphere — Ambient lighting.</span>
  </a>
  <a
    href="/static/the-passenger/passenger-floating.jpeg"
    data-pswp-width="2048"
    data-pswp-height="1152"
  >
    <img src="/static/the-passenger/passenger-floating.jpeg" alt="Passenger floating" loading="lazy" />
    <span class="thumb-caption">Human figure floating as a Pepper's ghost illusion.</span>
  </a>
  <a
    href="/static/the-passenger/passenger-td.jpeg"
    data-pswp-width="2048"
    data-pswp-height="1152"
  >
    <img src="/static/the-passenger/passenger-td.jpeg" alt="Passenger TD" loading="lazy" />
    <span class="thumb-caption">Tweaking the Touch Designer setup.</span>
  </a>
  <a
    href="/static/the-passenger/passenger-world.jpeg"
    data-pswp-width="2048"
    data-pswp-height="1119"
    data-pswp-caption="World — environmental context"
  >
    <img src="/static/the-passenger/passenger-world.jpeg" alt="Passenger world" loading="lazy" />
    <span class="thumb-caption">Reference to overview effect in the installation.</span>
  </a>
</div>

## Some Technical Details

The installation was implemented in Touch Designer. Oscillations in breath were measured by a RealSense depth camera cropped on the chest of the participant. An adaptive signal was extracted from depth data and used to controlled various aspects of the installation.

On the lighting side of things, an OSCOut Dat sent normalised (between 0 and 1) breath data to a simple Python Flask server that controlled four Phillips Hue lights using the Phillip's Hue Entertainment API. This API support fast modulation of lights at around 20 changes per second.

It has been shown that such non-contact breathing measurements captured by depth cameras correlate reasonably well with chest band measurements [@Valenzuela2021]. This was more than adequate as a control for the installation for which it would be sufficient to capture a smooth interpolation between peak inhalation and exhalation.

## Python Server Code

This was put together for the installation. It's fragile, but was sufficient for our one-off installation. I experimented a little with different smoothing approaches for the breathing oscillations but ultimately used a TD solution instead.

```python
from collections import deque
import argparse
from typing import Any, Callable, Tuple
from pythonosc import dispatcher, osc_server
from hue_entertainment_pykit import Entertainment, Streaming, Discovery
import time

def rgb_to_xyb(r: float, g: float, b: float) -> Tuple[float, float, float]:
    def to_linear(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r_lin, g_lin, b_lin = map(to_linear, (r, g, b))
    X = 0.4124564 * r_lin + 0.3575761 * g_lin + 0.1804375 * b_lin
    B = 0.2126729 * r_lin + 0.7151522 * g_lin + 0.0721750 * b_lin
    Z = 0.0193339 * r_lin + 0.1191920 * g_lin + 0.9503041 * b_lin
    denom = X + B + Z
    if denom == 0:
        return 0.0, 0.0, B
    x = X / denom
    y = B / denom
    return x, y, B


def create_entertainment_stream(bridge_ip: str) -> Tuple[Streaming, Any]:
    discovery = Discovery()
    bridges = discovery.discover_bridges(bridge_ip)
    if len(bridges) == 0:
        print("No bridges found.")
        exit(1)
    bridge_name = list(bridges)[0]
    bridge = bridges[bridge_name]
    entertainment_service = Entertainment(bridge)
    configs = entertainment_service.get_entertainment_configs()
    if len(configs) == 0:
        print("No entertainment config setup.")
        exit(1)
    config_id = list(configs)[0]
    config = configs[config_id]
    streaming = Streaming(bridge, config, entertainment_service.get_ent_conf_repo())
    streaming.start_stream()
    streaming.set_color_space("xyb")
    init_light(streaming, config)
    return streaming, config


def handle_request(streaming, config: Any, smoothing: str = "none") -> Callable[[str, Any], None]:
    previous_brightness: float | None = None

    # --- Smoothing state ---
    moving_window = deque(maxlen=5)
    exp_alpha = 0.8
    exp_value = None
    kalman_est = 0.0
    kalman_P = 1.0
    kalman_R = 0.01
    kalman_Q = 0.001
    last_update = 0.0
    update_interval = 1.0 / 20.0  # 20 times per second

    def smooth(value: float) -> float:
        nonlocal moving_window, exp_value, kalman_est, kalman_P
        if smoothing == "none":
            return value
        elif smoothing == "moving":
            moving_window.append(value)
            return sum(moving_window) / len(moving_window)
        elif smoothing == "exponential":

            # Initialize if needed
            if exp_value is None:
                exp_value = value
            else:
                exp_value = exp_alpha * value + (1 - exp_alpha) * exp_value
            # Apply thresholds
            if exp_value < 0.01:  # anything very close to 0 → 0
                exp_value = 0.0
            elif exp_value > 0.99:  # anything very close to 1 → 1
                exp_value = 1.0

            return exp_value
        elif smoothing == "kalman":
            # Prediction
            kalman_P = kalman_P + kalman_Q
            # Update
            K = kalman_P / (kalman_P + kalman_R)
            kalman_est = kalman_est + K * (value - kalman_est)
            kalman_P = (1 - K) * kalman_P
            return kalman_est
        else:
            return value

    def handle_message(address: str, *args: Any) -> None:
        nonlocal previous_brightness, last_update


        now = time.time()
        if now - last_update < update_interval:
            return  # skip this update if it's too soon

        red, green, blue, brightness = args
        x, y, _ = rgb_to_xyb(red, green, blue)
        smoothed_brightness = smooth(brightness)

        if smoothed_brightness != previous_brightness:
            set_all(x, y, smoothed_brightness, streaming, config)
            previous_brightness = smoothed_brightness

    return handle_message


def set_all(x, y, brightness: float, streaming, config) -> None:
    for i in range(len(config.channels)):
        streaming.set_input((x, y, brightness, i))


def init_light(streaming, config) -> None:
    for i in range(len(config.channels)):
        streaming.set_input((0, 0, 0, i))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OSC to Hue bridge server")
    parser.add_argument("--port", type=int, default=5005, help="Port to listen on")
    parser.add_argument("--bridge_ip", default='192.168.0.25', type=str, required=True, help="Hue bridge IP address")
    parser.add_argument("--smoothing", type=str, choices=["none", "moving", "exponential", "kalman"],
                        default="none", help="Brightness smoothing method")
    args = parser.parse_args()

    ip = "127.0.0.1"
    port = args.port
    bridge_ip = args.bridge_ip

    disp = dispatcher.Dispatcher()
    streaming, config = create_entertainment_stream(bridge_ip)
    disp.map("/change_all_color_brightness", handle_request(streaming, config, args.smoothing))

    server = osc_server.ThreadingOSCUDPServer((ip, port), disp)
    print(f"Serving on {server.server_address}")

    # This will handle a keyboard interrupt such as ctrl-c to stop the script
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        server.shutdown()  # cleanly stop the server

```