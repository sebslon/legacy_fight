import { IsNotEmpty } from 'class-validator';

export class CreateContractAttachmentDTO {
  @IsNotEmpty()
  public data: string;
}
