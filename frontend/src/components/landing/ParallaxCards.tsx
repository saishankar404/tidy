import { useScroll } from 'framer-motion';
import { useRef } from 'react';
import Card from './Card';
import { features } from './featuresData';

const ParallaxCards: React.FC = () => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end']
  })

  return (
    <section ref={container} className="relative" style={{ marginTop: '50vh' }}>
      {
        features.map( (feature, i) => {
          const targetScale = 1 - ( (features.length - i) * 0.05);
          return <Card key={`f_${i}`} i={i} title={feature.title} description={feature.description} color={feature.color} progress={scrollYProgress} range={[i * .25, 1]} targetScale={targetScale}/>
        })
      }
    </section>
  )
}

export default ParallaxCards;