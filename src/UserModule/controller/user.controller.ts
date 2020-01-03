import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { UserService } from '../service';
import { Constants, NeedRole, RoleGuard } from '../../CommonsModule';
import { ChangePasswordRequestIdDTO, ForgotPasswordDTO, NewUserDTO, UserDTO, UserUpdateDTO, NewStudentDTO, SelfUpdateDTO } from '../dto';
import { UserMapper } from '../mapper';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiImplicitBody,
  ApiImplicitQuery,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUseTags,
} from '@nestjs/swagger';
import { NewUserSwagger } from '../swagger';
import { RoleEnum } from '../../SecurityModule/enum';
import { ChangePasswordDTO } from '../dto/change-password.dto';
import { SecurityService } from '../../SecurityModule';
import { User } from '../entity';

@ApiUseTags('User')
@ApiBearerAuth()
@Controller(`${Constants.API_PREFIX}/${Constants.API_VERSION_1}/${Constants.USER_ENDPOINT}`)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly service: UserService,
    private readonly mapper: UserMapper,
    @Inject(forwardRef(() => SecurityService))
    private readonly securityService: SecurityService,
  ) {
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ title: 'Get Users', description: 'Get all users' })
  @ApiOkResponse({ type: NewUserDTO, isArray: true, description: 'All users' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have ADMIN role' })
  @NeedRole(RoleEnum.ADMIN)
  @UseGuards(RoleGuard)
  public async getAll(): Promise<UserDTO[]> {
    return this.mapper.toDtoList(await this.service.getAll());
  }

  @Get('/me')
  @HttpCode(200)
  @ApiOkResponse({ type: UserDTO })
  @ApiImplicitQuery({ name: 'id', type: Number, required: true, description: 'User id' })
  @ApiOperation({ title: 'Find user by jwt id', description: 'Decodes de jwt and finds the user by the jwt id' })
  @ApiNotFoundResponse({ description: 'thrown if user is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have ADMIN or STUDENT role' })
  @NeedRole(RoleEnum.ADMIN, RoleEnum.STUDENT)
  @UseGuards(RoleGuard)
  public async findUserByJwtId(
    @Headers('authorization') authorization: string,
  ): Promise<UserDTO> {
    const { id }: User = this.securityService.getUserFromToken(authorization.split(' ')[1]);
    this.logger.log(`user id: ${id}`);
    return this.mapper.toDto(await this.service.findById(id));
  }

  @Put('/me')
  @HttpCode(200)
  @ApiOkResponse({ type: UserDTO })
  @ApiOperation({ title: 'Update user by jwt id', description: 'Decodes de jwt and updates the user by the jwt id' })
  @ApiNotFoundResponse({ description: 'thrown if user is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have ADMIN or STUDENT role' })
  @NeedRole(RoleEnum.ADMIN, RoleEnum.STUDENT)
  @UseGuards(RoleGuard)
  public async updateUserByJwtId(
    @Headers('authorization') authorization: string,
    @Body() selfUpdatedInfo: SelfUpdateDTO,
  ): Promise<UserDTO> {
    const { id }: User = this.securityService.getUserFromToken(authorization.split(' ')[1]);
    this.logger.log(`user id: ${id}`);
    return this.mapper.toDto(await this.service.update(id, selfUpdatedInfo as UserUpdateDTO));
  }

  @Get('/:id')
  @HttpCode(200)
  @ApiOkResponse({ type: NewUserDTO })
  @ApiImplicitQuery({ name: 'id', type: Number, required: true, description: 'User id' })
  @ApiOperation({ title: 'Find user by id', description: 'Find user by id' })
  @ApiNotFoundResponse({ description: 'thrown if user is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have ADMIN role' })
  @NeedRole(RoleEnum.ADMIN)
  @UseGuards(RoleGuard)
  public async findById(
    @Param('id') id: UserDTO['id'],
  ): Promise<UserDTO> {
    this.logger.log(`user id: ${id}`);
    return this.mapper.toDto(await this.service.findById(id));
  }

  @Post()
  @HttpCode(201)
  @Transactional()
  @ApiCreatedResponse({ type: NewUserDTO, description: 'User created' })
  @ApiOperation({ title: 'Add user', description: 'Creates a new user' })
  @ApiImplicitBody({ name: 'User', type: NewUserDTO })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have ADMIN role' })
  @NeedRole(RoleEnum.ADMIN)
  @UseGuards(RoleGuard)
  public async add(@Body() user: NewUserDTO): Promise<UserDTO> {
    this.logger.log(`user: ${user}`);
    return this.mapper.toDto(await this.service.add(user));
  }

  @Post('/student')
  @HttpCode(201)
  @Transactional()
  @ApiCreatedResponse({ type: NewUserDTO, description: 'User student created' })
  @ApiOperation({ title: 'Add student user', description: 'Creates a new student' })
  @ApiImplicitBody({ name: 'User', type: NewStudentDTO })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have EXTERNAL role' })
  @NeedRole(RoleEnum.EXTERNAL)
  @UseGuards(RoleGuard)
  public async addStudent(@Body() user: NewStudentDTO): Promise<UserDTO> {
    this.logger.log(`user: ${user}`);
    return this.mapper.toDto(await this.service.add({ ...user, role: RoleEnum.STUDENT }));
  }

  @Put(':id')
  @HttpCode(200)
  @ApiImplicitQuery({ name: 'id', type: Number, required: true, description: 'User id' })
  @ApiOperation({ title: 'Update user', description: 'Update user by id' })
  @ApiOkResponse({ type: UserDTO })
  @ApiNotFoundResponse({ description: 'thrown if user is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have ADMIN or STUDENT role' })
  @NeedRole(RoleEnum.ADMIN, RoleEnum.STUDENT)
  @UseGuards(RoleGuard)
  public async update(
    @Headers('authorization') authorization: string,
    @Param('id') id: UserDTO['id'],
    @Body() userUpdatedInfo: UserUpdateDTO,
  ): Promise<UserDTO> {
    const user: User = this.securityService.getUserFromToken<User>(authorization.split(' ')[1]);
    if (!user?.role?.name || user.role.name === RoleEnum.EXTERNAL) {
      throw new UnauthorizedException('EXTERNAL users cannot change their or others information');
    }
    if (user.role.name === RoleEnum.STUDENT) {
      if (id !== user.id) {
        throw new UnauthorizedException('Only ADMIN user can update other users information');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { role, ...otherInformations } = userUpdatedInfo;
      return this.mapper.toDto(await this.service.update(user.id, otherInformations as UserUpdateDTO));
    }
    this.logger.log(`user id: ${id}, new user information: ${userUpdatedInfo}`);
    return this.mapper.toDto(await this.service.update(id, userUpdatedInfo));
  }

  @Post('/forgot-password')
  @HttpCode(200)
  @Transactional()
  @ApiOkResponse({ type: ChangePasswordRequestIdDTO })
  @ApiOperation({ title: 'Create change password request', description: 'Create change password request' })
  @ApiNotFoundResponse({ description: 'thrown if user is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have EXTERNAL role' })
  @NeedRole(RoleEnum.EXTERNAL)
  @UseGuards(RoleGuard)
  public async forgotPassword(@Body() forgotPasswordDTO: ForgotPasswordDTO): Promise<ChangePasswordRequestIdDTO> {
    this.logger.log(`forgot password: ${forgotPasswordDTO}`);
    const forgotPasswordRequestId = await this.service.forgotPassword(forgotPasswordDTO);
    const changePasswordRequestIdDTO = new ChangePasswordRequestIdDTO();
    changePasswordRequestIdDTO.id = forgotPasswordRequestId;
    return changePasswordRequestIdDTO;
  }

  @Get('/forgot-password/:changePasswordRequestId/validate')
  @HttpCode(200)
  @ApiOperation({
    title: 'Validate change password request',
    description: 'validate change password expiration time. If time is not expired, 200 is returned',
  })
  @ApiGoneResponse({ description: 'thrown if change password request time is up' })
  @ApiNotFoundResponse({ description: 'thrown if change password request is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have EXTERNAL role' })
  @NeedRole(RoleEnum.EXTERNAL)
  @UseGuards(RoleGuard)
  public async validateChangePasswordExpirationTime(@Param('changePasswordRequestId') changePasswordRequestId: string) {
    this.logger.log(`change password request id: ${changePasswordRequestId}`);
    await this.service.validateChangePassword(changePasswordRequestId);
  }

  @Post('/forgot-password/:changePasswordRequestId')
  @HttpCode(200)
  @ApiOperation({
    title: 'change password',
  })
  @ApiNotFoundResponse({ description: 'thrown if change password request is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have EXTERNAL role' })
  @NeedRole(RoleEnum.EXTERNAL)
  @UseGuards(RoleGuard)
  public async changePassword(
    @Param('changePasswordRequestId') changePasswordRequestId: string,
    @Body() changePasswordDTO: ChangePasswordDTO,
  ): Promise<void> {
    this.logger.log(`change password request id: ${changePasswordRequestId}, change password information: ${changePasswordDTO}`);
    await this.service.changePassword(changePasswordRequestId, changePasswordDTO);
  }

  @Post('/:userId/certificate/:certificateId')
  public async addCertificateToUser(
    @Param('userId') userId: string,
    @Param('certificateId') certificateId: string,
  ) {
    this.logger.log(`user id: ${userId}, certificate id: ${certificateId}`);
    await this.service.addCertificateToUser(userId, certificateId);
  }

  @Delete('/:id')
  @HttpCode(200)
  @ApiImplicitQuery({ name: 'id', type: Number, required: true, description: 'User id' })
  @ApiOperation({ title: 'Delete user', description: 'Delete user by id' })
  @ApiOkResponse({ type: null })
  @ApiNotFoundResponse({ description: 'thrown if user is not found' })
  @ApiUnauthorizedResponse({ description: 'thrown if there is not an authorization token or if authorization token does not have ADMIN role' })
  @NeedRole(RoleEnum.ADMIN)
  @UseGuards(RoleGuard)
  public async delete(@Param('id') id: UserDTO['id']): Promise<void> {
    this.logger.log(`user id: ${id}`);
    await this.service.delete(id);
  }
}
