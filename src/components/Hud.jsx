/** Speed, distance and obstacles smashed (top right). */
export default function Hud({ hud }) {
  return (
    <div className="hud mono" aria-hidden="true">
      <div>speed<b>{hud.speed} km/h</b></div>
      <div>odometer<b>{hud.odo} km</b></div>
      <div>smashed<b>{hud.hits}</b></div>
    </div>
  );
}
