interface FeatureCardProps {
  title: string;
  description: string;
  angle?: string;
}

const FeatureCard = ({ title, description, angle = "0deg" }: FeatureCardProps) => {
  return (
    <div 
      className="bg-card border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
      style={{ transform: `rotate(${angle})` }}
    >
      <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;
