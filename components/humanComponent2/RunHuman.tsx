import { Component } from "react";
import type { Human, Config } from '@vladmandic/human';

const config: Partial<Config> = {
  debug: false,
  backend: 'webgl',
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
  filter: { enabled: true, equalization: false, flip: false },
  face: {
    enabled: true,
    detector: { rotation: false, maxDetected: 2, minConfidence: 0.2, return: true },
    iris: { enabled: false },
    description: { enabled: false },
    emotion: { enabled: false },
    antispoof: { enabled: false },
    liveness: { enabled: false },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
}

interface Props { inputId: string, outputId: string };
interface State { ready: boolean, frame: number };

class RunHuman extends Component<Props, State> {
  HumanImport: any;
  human: Human | undefined = undefined;
  image: HTMLImageElement | undefined = undefined;
  canvas: HTMLCanvasElement | undefined = undefined;
  timestamp: number = 0;

  constructor(props: Props) { // human is loaded as dynamic import in component constructor and then sets ready state
    super(props)
    if (typeof document === 'undefined') return;
    this.image = document.getElementById(this.props.inputId) as (HTMLImageElement | undefined) || document.createElement('img');
    this.canvas = document.getElementById(this.props.outputId) as (HTMLCanvasElement | undefined) || document.createElement('canvas');
    import('@vladmandic/human').then((H) => {
      this.human = new H.default(config) as Human;
      console.log('human version:', this.human.version, '| tfjs version:', this.human.tf.version['tfjs-core']);
      console.log('platform:', this.human.env.platform, '| agent:', this.human.env.agent);
      console.log('loading models...')
      this.human.load().then(() => { // preload all models
        console.log('backend', this.human!.tf.getBackend(), '| available：', this.human!.env.backends);
        console.log('loaded models:' + Object.values(this.human!.models).filter((model) => model !== null).length);
        console.log('initializing...')
        this.human!.warmup().then(() => { // warmup function to initialize backend for future faster detection
          this.setState({ ready: true });
          console.log('ready...')
        });
      });
    });
  }

  override async componentDidMount() { // add event handlers for resize and click
    if (this.image) this.image.onresize = () => {
      this.canvas!.width = this.image!.width;
      this.canvas!.height = this.image!.height;
    }
  }

  override render(this: RunHuman) {
    if (this && this.state && this.state.ready) this.detect(); // start detection loop once component is created and human state is ready trigger detection and draw loops
    if (!this || !this.image || !this.canvas || !this.human || !this.human.result) return null;
    return null;
  }

  async detect(this: RunHuman) { // main detection loop
    if (!this || !this.human || !this.image || !this.canvas) return;
    const detect = await this.human.detect(this.image);
    if (detect) {
      console.log('detect')
      this.canvas.width = detect.width;
      this.canvas.height = detect.height;
      this.human.draw.all(this.canvas, detect)
      console.log(detect)
    }

  }
}

export default RunHuman;
