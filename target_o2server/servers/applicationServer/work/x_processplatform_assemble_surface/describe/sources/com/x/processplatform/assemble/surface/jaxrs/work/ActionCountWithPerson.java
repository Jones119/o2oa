package com.x.processplatform.assemble.surface.jaxrs.work;

import java.time.Instant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.apache.commons.lang3.StringUtils;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.annotation.FieldDescribe;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.gson.GsonPropertyObject;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.core.entity.content.Read;
import com.x.processplatform.core.entity.content.ReadCompleted;
import com.x.processplatform.core.entity.content.Review;
import com.x.processplatform.core.entity.content.Task;
import com.x.processplatform.core.entity.content.TaskCompleted;
import com.x.processplatform.core.entity.content.TaskCompleted_;
import com.x.processplatform.core.entity.element.Application;

import io.swagger.v3.oas.annotations.media.Schema;

class ActionCountWithPerson extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionCountWithPerson.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String credential, String appFlag) throws Exception {
		LOGGER.debug("execute:{}, credential:{}.", effectivePerson::getDistinguishedName, () -> credential);
		ActionResult<Wo> result = new ActionResult<>();
		Wo wo = new Wo();
		String person = null;
		String appId = appFlag;
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			person = business.organization().person().get(credential);
			if(StringUtils.isNotBlank(appId)) {
				Application application = emc.flag(appFlag, Application.class);
				appId = application.getId();
			}
		}
		if (StringUtils.isNotEmpty(person)) {
			final String dn = person;
		}
		result.setData(wo);
		return result;
	}

	private Long countTask(String dn, String appId) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			if (StringUtils.isBlank(appId)) {
				return emc.countEqual(Task.class, Task.person_FIELDNAME, dn);
			} else {
				return emc.countEqualAndEqual(Task.class, Task.person_FIELDNAME, dn, Task.application_FIELDNAME,
						appId);
			}
		}
	}

	private Long countTaskCompleted(String dn, String appId) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			EntityManager em;
			em = emc.get(TaskCompleted.class);
			CriteriaBuilder cb = em.getCriteriaBuilder();
			CriteriaQuery<Long> cq = cb.createQuery(Long.class);
			Root<TaskCompleted> root = cq.from(TaskCompleted.class);
			Predicate p = cb.equal(root.get(TaskCompleted_.person), dn);
			if (StringUtils.isNotBlank(appId)) {
				p = cb.and(p, cb.equal(root.get(TaskCompleted_.application), appId));
			}
			p = cb.and(p, cb.or(cb.equal(root.get(TaskCompleted_.latest), true),
					cb.isNull(root.get(TaskCompleted_.latest))));
			return em.createQuery(cq.select(cb.count(root)).where(p)).getSingleResult();
		}
	}

	private Long countRead(String dn, String appId) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			if (StringUtils.isBlank(appId)) {
				return emc.countEqual(Read.class, Read.person_FIELDNAME, dn);
			} else {
				return emc.countEqualAndEqual(Read.class, Read.person_FIELDNAME, dn, Read.application_FIELDNAME,
						appId);
			}
		}
	}

	private Long countReadCompleted(String dn, String appId) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			if (StringUtils.isBlank(appId)) {
				return emc.countEqual(ReadCompleted.class, ReadCompleted.person_FIELDNAME, dn);
			} else {
				return emc.countEqualAndEqual(ReadCompleted.class, ReadCompleted.person_FIELDNAME, dn,
						ReadCompleted.application_FIELDNAME, appId);
			}
		}
	}

	private Long countReview(String dn, String appId) throws Exception {
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			if (StringUtils.isBlank(appId)) {
				return emc.countEqual(Review.class, Review.person_FIELDNAME, dn);
			} else {
				return emc.countEqualAndEqual(Review.class, Review.person_FIELDNAME, dn,
						Review.application_FIELDNAME, appId);
			}
		}
	}

	public static class Wo extends GsonPropertyObject {

		private static final long serialVersionUID = -4391978436352777470L;

		@FieldDescribe("待办数量.")
		@Schema(description = "待办数量.")
		private Long task = 0L;
		@FieldDescribe("已办数量.")
		@Schema(description = "已办数量.")
		private Long taskCompleted = 0L;
		@FieldDescribe("待阅数量.")
		@Schema(description = "待阅数量.")
		private Long read = 0L;
		@FieldDescribe("已阅数量.")
		@Schema(description = "已阅数量.")
		private Long readCompleted = 0L;
		@FieldDescribe("待阅数量.")
		@Schema(description = "待阅数量.")
		private Long review = 0L;

		public Long getTask() {
			return task;
		}

		public void setTask(Long task) {
			this.task = task;
		}

		public Long getTaskCompleted() {
			return taskCompleted;
		}

		public void setTaskCompleted(Long taskCompleted) {
			this.taskCompleted = taskCompleted;
		}

		public Long getRead() {
			return read;
		}

		public void setRead(Long read) {
			this.read = read;
		}

		public Long getReadCompleted() {
			return readCompleted;
		}

		public void setReadCompleted(Long readCompleted) {
			this.readCompleted = readCompleted;
		}

		public Long getReview() {
			return review;
		}

		public void setReview(Long review) {
			this.review = review;
		}

	}

}
