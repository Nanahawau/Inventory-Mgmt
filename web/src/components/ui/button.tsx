import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  size?: "sm" | "md";
};

export default function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  return (
    <button
      className={clsx(
        variant === "primary" ? "btn-primary" : "btn-outline",
        size === "sm" ? "btn-sm" : "btn-md",
        className
      )}
      {...rest}
    />
  );
}