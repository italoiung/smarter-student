import type { Handler, HTTPResponse } from 'puppeteer-core';
import { UlifePage, type IApiRespose } from './Page';

interface IDashboardApiResponse extends IApiRespose {
  Result: {
    DefaultList: {
      DisciplineName: string;
      ContentUrl: string;
      LessonCategoryHasProgressBar: boolean;
    }[];
  };
}

export class UlifeDashboard extends UlifePage {
  static API_ROUTE = '/Student/Disciplines' as const;
  protected _pageHref = 'https://student.ulife.com.br';

  private _subjects: { name: string; url: string }[] = [];

  public get subjects() {
    return this._subjects;
  }

  private set subjects(newSet) {
    this._subjects = [...new Set([...this._subjects, ...newSet])];
  }

  protected onResponse: Handler<HTTPResponse> = async (response) => {
    const requestUrl = new URL(response.request().url());

    if (requestUrl.pathname === UlifeDashboard.API_ROUTE) {
      const {
        Result: { DefaultList: responseData },
      }: IDashboardApiResponse = await response.json();

      this.subjects = responseData
        .filter((subject) => subject.LessonCategoryHasProgressBar)
        .map((subject) => ({
          name: subject.DisciplineName,
          url: subject.ContentUrl,
        }));

      this.setStatusReady();
    }
  };
}
