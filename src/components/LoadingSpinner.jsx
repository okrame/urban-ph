const LoadingSpinner = ({ size = 20, color = '#4A7E74', className = '' }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        className="animate-spin rounded-full border-2 border-t-2 border-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderTopColor: color,
          borderRightColor: color
        }}
      />
    </div>
  );
};

export default LoadingSpinner;