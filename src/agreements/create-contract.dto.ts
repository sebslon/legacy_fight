import { IsNotEmpty } from 'class-validator';

export class CreateContractDTO {
  @IsNotEmpty()
  public subject: string;

  @IsNotEmpty()
  public partnerName: string;
}
