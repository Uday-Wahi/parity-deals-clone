export default function CountryFlag({ countryCode }: { countryCode: string }) {
  const emoji = countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));

  return (
    <span
      role="img"
      style={{
        display: "inline-block",
        fontSize: "1rem",
        lineHeight: "1rem",
        verticalAlign: "middle",
      }}
    >
      {emoji}
    </span>
  );
}
