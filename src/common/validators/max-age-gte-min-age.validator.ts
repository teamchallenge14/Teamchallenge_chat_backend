import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'maxAgeGteMinAge', async: false })
export class MaxAgeGteMinAgeConstraint implements ValidatorConstraintInterface {
  validate(value: number | undefined, args: ValidationArguments): boolean {
    const dto = args.object as { minAge?: number };
    if (value === undefined || dto.minAge === undefined) {
      return true;
    }

    return value >= dto.minAge;
  }

  defaultMessage(): string {
    return 'maxAge must be greater than or equal to minAge';
  }
}
