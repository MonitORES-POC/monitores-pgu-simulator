import { Constraint } from '../entities/constraint.entity';

export class ConstraintDto {
  public constraint: Constraint;
  public statusId: number;
  public contractPower: number;
}
