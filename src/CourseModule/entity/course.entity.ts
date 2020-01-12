import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Audit } from '../../CommonsModule';
import { Lesson } from './lesson.entity';
import { Expose } from 'class-transformer';
import slugify from 'slugify';
import { User } from '../../UserModule';
import { CourseTaken } from 'src/CourseTakenModule/entity';

@Entity()
export class Course extends Audit {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column({
    nullable: false,
    unique: true,
  })
  @Expose()
  title: string;

  @Column({
    nullable: false,
  })
  @Expose()
  description: string;

  @Column({
    nullable: true,
  })
  @Expose()
  thumbUrl: string;

  @ManyToOne<User>('User', (user: User) => user.createdCourses)
  @JoinColumn({ name: 'userId' })
  @Expose()
  author: User;

  @Column()
  photoName: string;

  @OneToMany<Lesson>('Lesson', (lesson: Lesson) => lesson.course)
  lessons: Lesson[];

  @OneToMany<CourseTaken>('CourseTaken', (takenCourses: CourseTaken) => takenCourses.course)
  takenCourses: CourseTaken[];

  @Column()
  @Expose()
  get slug(): string {
    return slugify(this.title, { replacement: '-', lower: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  set slug(slug: string) {
  }

}
