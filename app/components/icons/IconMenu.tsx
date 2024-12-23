import Icon, {IconProps} from './Icon';

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props} stroke={props.stroke || 'currentColor'} height={24}>
      <title>Menu</title>
      <line x1="1" y1="4.375" x2="20" y2="4.375" strokeWidth="1.75" />
      <line x1="1" y1="10.375" x2="20" y2="10.375" strokeWidth="1.75" />
      <line x1="1" y1="16.375" x2="20" y2="16.375" strokeWidth="1.75" />
    </Icon>
  );
}
