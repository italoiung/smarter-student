import type { Handler, HTTPResponse, Page } from 'puppeteer-core';
import { UlifePage, type IApiRespose } from './Page';

interface ISubjectApiResponse extends IApiRespose {
  HasMoreLessons: boolean;
  Result: {
    LessonName: string;
    StudentLessonCategoryList: {
      LessonCategoryName: string;
      StudentCategoryUrl: string;
    }[];
  }[];
}

export class UlifeSubject extends UlifePage {
  static API_ROUTE = '/Lesson/GetStudentView' as const;

  constructor(
    page: Page,
    protected _pageHref: string,
  ) {
    super(page);
  }

  private _lessons: { name: string; url: string }[] = [];

  public get lessons() {
    return this._lessons;
  }

  private set lessons(newSet) {
    this._lessons = [...new Set([...this._lessons, ...newSet])];
  }

  protected onResponse: Handler<HTTPResponse> = async (response) => {
    const requestUrl = new URL(response.request().url());

    if (requestUrl.pathname === UlifeSubject.API_ROUTE) {
      const { Result: responseData, HasMoreLessons: hasMore }: ISubjectApiResponse = await response.json();

      this.lessons = responseData
        .filter(({ LessonName: subjectName }) => subjectName.startsWith('Unidade'))
        .map(({ StudentLessonCategoryList: lessons, LessonName: subjectName }) => lessons
          .filter(({ LessonCategoryName: lessonName }) => !/^[\d\W]*(fórum|referências)/ui.test(lessonName))
          .map(({ LessonCategoryName: lessonName, StudentCategoryUrl: url }, lessonIndex) => ({
            name: lessonName.replace(/^[\d\W(?:unidade)]*(.*)[\W(?:\(\w+\))]*$/ui, `${subjectName.trim()} - ${this.lessons.length + lessonIndex} - $1`).trim(),
            url,
        }))).flat();

      if (!hasMore && this.status !== 'loaded') this.status = 'loaded';
    }
  };
}
