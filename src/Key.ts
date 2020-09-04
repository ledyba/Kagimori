export default interface Key {
  issuer: string;
  label: string;
  type: string;
  period: number;
  digits: number;
  algorithm: string;
  secret: string;
}
