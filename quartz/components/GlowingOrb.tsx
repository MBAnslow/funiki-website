import { classNames } from "../util/lang"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import glowOrbScript from "./scripts/glowOrb.inline"

const GlowingOrb: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return <div class={classNames(displayClass, "glow-orb")} aria-hidden="true" />
}

GlowingOrb.afterDOMLoaded = glowOrbScript

export default (() => GlowingOrb) satisfies QuartzComponentConstructor

